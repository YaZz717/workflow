import { createHash, randomBytes } from "node:crypto";

/** Génère un token opaque (envoyé par email) + son hash (stocké en base). */
export function generateToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function addMinutes(minutes: number, from = new Date()): Date {
  return new Date(from.getTime() + minutes * 60_000);
}

export function addDays(days: number, from = new Date()): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60_000);
}
