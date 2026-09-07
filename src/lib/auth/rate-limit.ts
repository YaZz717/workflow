import { prisma } from "@/lib/prisma";
import { env } from "@/env";

/**
 * Rate-limiting des tentatives de connexion, basé sur la table LoginAttempt.
 * Compte les échecs récents pour un couple (email, ip).
 */
export async function isLoginRateLimited(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - env.LOGIN_WINDOW_MINUTES * 60_000);
  const failures = await prisma.loginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [{ email: email.toLowerCase() }, { ip }],
    },
  });
  return failures >= env.LOGIN_MAX_ATTEMPTS;
}

export async function recordLoginAttempt(params: {
  email: string;
  ip: string;
  success: boolean;
  userId?: string | null;
}): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      email: params.email.toLowerCase(),
      ip: params.ip,
      success: params.success,
      userId: params.userId ?? null,
    },
  });
}

/** Purge les tentatives anciennes (appelée après une connexion réussie). */
export async function clearOldLoginAttempts(email: string): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60_000);
  await prisma.loginAttempt.deleteMany({
    where: { email: email.toLowerCase(), createdAt: { lt: cutoff } },
  });
}
