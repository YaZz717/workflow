"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { generateToken, hashToken, addDays, addMinutes } from "@/lib/tokens";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/auth/emails";
import { recordAudit } from "@/lib/audit";
import { getClientIp } from "@/server/context";
import { slugify } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { actionError, actionOk, parseOrFail, type ActionResult } from "@/lib/actions";

const VERIFICATION_PURPOSE = "email-verification";

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base) || "org";
  let candidate = root;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${i++}`;
  }
  return candidate;
}

// ---------------------------------------------------------------------------

export async function registerAction(
  _prev: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const parsed = parseOrFail(registerSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;
  const { name, email, password, organizationName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return actionError("Un compte existe déjà avec cette adresse email.");
  }

  const passwordHash = await hashPassword(password);
  const { token, tokenHash } = generateToken();

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash },
    });

    const org = await tx.organization.create({
      data: {
        name: organizationName,
        slug: await uniqueOrgSlug(organizationName),
        description: `Espace de travail de ${name}`,
        settings: { create: {} },
        subscription: { create: { plan: "FREE", status: "TRIALING", seats: 5 } },
        members: { create: { userId: created.id, role: "OWNER" } },
      },
    });

    await tx.verificationToken.create({
      data: {
        identifier: `${VERIFICATION_PURPOSE}:${email}`,
        token: tokenHash,
        expires: addDays(1),
      },
    });

    await recordAudit({
      organizationId: org.id,
      actorId: created.id,
      action: "user.register",
      resourceType: "User",
      resourceId: created.id,
      summary: `${name} a créé un compte et l'organisation « ${org.name} »`,
      ip: await getClientIp(),
    });

    return created;
  });

  await sendVerificationEmail(user.email, token);
  return actionOk({ email }, "Compte créé. Vérifiez votre boîte mail pour activer votre compte.");
}

// ---------------------------------------------------------------------------

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseOrFail(loginSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.cause?.err?.message === "EMAIL_NOT_VERIFIED") {
        return actionError(
          "Votre email n'est pas encore vérifié. Consultez votre boîte mail ou demandez un nouveau lien.",
        );
      }
      if (err.cause?.err?.name === "RateLimitError") {
        return actionError("Trop de tentatives de connexion. Réessayez dans quelques minutes.");
      }
      return actionError("Email ou mot de passe incorrect.");
    }
    throw err;
  }

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseOrFail(forgotPasswordSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Réponse identique que le compte existe ou non (anti-énumération).
  if (user && user.isActive) {
    const { token, tokenHash } = generateToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expires: addMinutes(60) },
    });
    await sendPasswordResetEmail(user.email, token);
  }

  return actionOk(undefined, "Si un compte existe, un email de réinitialisation vient d'être envoyé.");
}

// ---------------------------------------------------------------------------

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseOrFail(resetPasswordSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expires < new Date()) {
    return actionError("Ce lien de réinitialisation est invalide ou expiré.");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, emailVerified: record.user.emailVerified ?? new Date() },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalide les autres tokens de reset en attente.
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  await recordAudit({
    actorId: record.userId,
    action: "user.password_reset",
    resourceType: "User",
    resourceId: record.userId,
    summary: "Mot de passe réinitialisé via email",
    ip: await getClientIp(),
  });

  return actionOk(undefined, "Mot de passe mis à jour. Vous pouvez vous connecter.");
}

// ---------------------------------------------------------------------------

export async function resendVerificationAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.emailVerified) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: `${VERIFICATION_PURPOSE}:${email}` },
    });
    const { token, tokenHash } = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: `${VERIFICATION_PURPOSE}:${email}`,
        token: tokenHash,
        expires: addDays(1),
      },
    });
    await sendVerificationEmail(email, token);
  }

  return actionOk(undefined, "Si nécessaire, un nouveau lien de vérification a été envoyé.");
}
