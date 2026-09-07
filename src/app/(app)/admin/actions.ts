"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireGlobalAdmin, getClientIp } from "@/server/context";
import { recordAudit } from "@/lib/audit";
import { actionError, actionOk, parseOrFail, type ActionResult } from "@/lib/actions";

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

export async function setGlobalRoleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireGlobalAdmin();
  const parsed = parseOrFail(roleSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;
  if (parsed.data.userId === admin.id) {
    return actionError("Vous ne pouvez pas modifier votre propre rôle.");
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target) return actionError("Utilisateur introuvable.");
  if (target.globalRole === parsed.data.role) return actionOk(undefined, "Aucun changement.");

  await prisma.user.update({
    where: { id: target.id },
    data: { globalRole: parsed.data.role },
  });
  await recordAudit({
    actorId: admin.id,
    action: "admin.global_role_change",
    resourceType: "User",
    resourceId: target.id,
    summary: `${admin.name} a changé le rôle plateforme de ${target.name ?? target.email} de ${target.globalRole} à ${parsed.data.role}`,
    oldValue: { globalRole: target.globalRole },
    newValue: { globalRole: parsed.data.role },
    ip: await getClientIp(),
  });
  revalidatePath("/admin/users");
  return actionOk(undefined, "Rôle mis à jour.");
}

const toggleSchema = z.object({ userId: z.string().min(1), active: z.enum(["true", "false"]) });

export async function toggleUserActiveAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireGlobalAdmin();
  const parsed = parseOrFail(toggleSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;
  if (parsed.data.userId === admin.id) {
    return actionError("Vous ne pouvez pas désactiver votre propre compte.");
  }

  const active = parsed.data.active === "true";
  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target) return actionError("Utilisateur introuvable.");

  await prisma.$transaction([
    prisma.user.update({ where: { id: target.id }, data: { isActive: active } }),
    // Révoque les sessions actives si désactivation.
    ...(active ? [] : [prisma.session.deleteMany({ where: { userId: target.id } })]),
  ]);
  await recordAudit({
    actorId: admin.id,
    action: active ? "admin.user_activate" : "admin.user_deactivate",
    resourceType: "User",
    resourceId: target.id,
    summary: `${admin.name} a ${active ? "réactivé" : "désactivé"} le compte de ${target.name ?? target.email}`,
    ip: await getClientIp(),
  });
  revalidatePath("/admin/users");
  return actionOk(undefined, active ? "Compte réactivé." : "Compte désactivé.");
}
