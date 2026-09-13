"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser, requireOrgCapability, getClientIp } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { recordAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { stripe } from "@/lib/stripe";
import { env } from "@/env";
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

// ---------------------------------------------------------------------------
// Facturation Stripe (mode test — voir .env.example)
// ---------------------------------------------------------------------------

/** Démarre un abonnement Pro via Stripe Checkout (redirige vers Stripe). */
export async function startCheckoutAction(): Promise<ActionResult> {
  const org = await getActiveOrganization();
  await requireOrgCapability(org.id, "org.billing");

  if (!stripe || !env.STRIPE_PRICE_ID_PRO) {
    return actionError("Facturation non configurée pour le moment.");
  }

  const subscription = await prisma.subscription.upsert({
    where: { organizationId: org.id },
    create: { organizationId: org.id, plan: "FREE", status: "TRIALING", seats: 5 },
    update: {},
  });

  let customerId = subscription.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await prisma.subscription.update({
      where: { organizationId: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
    metadata: { organizationId: org.id },
    subscription_data: { metadata: { organizationId: org.id } },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/settings/organization?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/settings/organization?checkout=cancelled`,
  });

  if (!session.url) return actionError("Impossible de créer la session de paiement.");
  redirect(session.url);
}

/** Ouvre le portail Stripe (gestion / résiliation de l'abonnement). */
export async function openBillingPortalAction(): Promise<ActionResult> {
  const org = await getActiveOrganization();
  await requireOrgCapability(org.id, "org.billing");

  if (!stripe) return actionError("Facturation non configurée pour le moment.");

  const subscription = await prisma.subscription.findUnique({ where: { organizationId: org.id } });
  if (!subscription?.stripeCustomerId) {
    return actionError("Aucun abonnement Stripe actif pour cette organisation.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/settings/organization`,
  });
  redirect(session.url);
}
