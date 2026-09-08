"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser, getClientIp } from "@/server/context";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { recordAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validations/auth";
import { actionError, actionOk, parseOrFail, type ActionResult } from "@/lib/actions";
import { z } from "zod";

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseOrFail(updateProfileSchema, {
    name: formData.get("name"),
    image: formData.get("image") || null,
    timezone: formData.get("timezone") || undefined,
    locale: formData.get("locale") || undefined,
  });
  if (!parsed.success) return parsed.result;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      image: parsed.data.image ?? null,
      timezone: parsed.data.timezone,
      locale: parsed.data.locale,
    },
  });
  await recordAudit({
    actorId: user.id,
    action: "user.profile_update",
    resourceType: "User",
    resourceId: user.id,
    summary: `${parsed.data.name} a mis à jour son profil`,
    ip: await getClientIp(),
  });
  revalidatePath("/settings/profile");
  return actionOk(undefined, "Profil mis à jour.");
}

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseOrFail(changePasswordSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.passwordHash) return actionError("Compte sans mot de passe local.");

  const valid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) return actionError("Mot de passe actuel incorrect.", { currentPassword: ["Incorrect"] });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  await recordAudit({
    actorId: user.id,
    action: "user.password_change",
    resourceType: "User",
    resourceId: user.id,
    summary: `${dbUser.name} a changé son mot de passe`,
    ip: await getClientIp(),
  });
  return actionOk(undefined, "Mot de passe modifié.");
}

export async function updateNotificationPrefsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const { CONFIGURABLE_TYPES } = await import("@/lib/notification-prefs");

  const prefs: Record<string, { inApp: boolean }> = {};
  for (const { type } of CONFIGURABLE_TYPES) {
    prefs[type] = { inApp: formData.get(`pref_${type}`) === "on" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { notificationPrefs: prefs },
  });
  return actionOk(undefined, "Préférences enregistrées.");
}

const createOrgSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(80),
  description: z.string().max(280).optional(),
});

export async function createOrganizationAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parseOrFail(createOrgSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;

  const root = slugify(parsed.data.name) || "org";
  let slug = root;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) slug = `${root}-${i++}`;

  const org = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      settings: { create: {} },
      subscription: { create: { plan: "FREE", status: "TRIALING", seats: 5 } },
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  await recordAudit({
    organizationId: org.id,
    actorId: user.id,
    action: "org.create",
    resourceType: "Organization",
    resourceId: org.id,
    summary: `${user.name} a créé l'organisation « ${org.name} »`,
    ip: await getClientIp(),
  });
  return actionOk({ id: org.id }, "Organisation créée.");
}
