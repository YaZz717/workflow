import bcrypt from "bcryptjs";
import { z } from "zod";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Politique de mot de passe : 10+ caractères, au moins une minuscule,
 * une majuscule et un chiffre.
 */
export const passwordSchema = z
  .string()
  .min(10, "Au moins 10 caractères")
  .max(200)
  .regex(/[a-z]/, "Au moins une minuscule")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[0-9]/, "Au moins un chiffre");
