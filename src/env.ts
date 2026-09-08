import { z } from "zod";

/**
 * Validation des variables d'environnement au démarrage.
 * Toute variable manquante ou invalide fait planter l'app immédiatement
 * plutôt que de provoquer une erreur obscure plus tard.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET doit faire au moins 16 caractères"),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3002"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("WorkFlow <no-reply@workflow.local>"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  CRON_SECRET: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Variables d'environnement invalides :",
    z.treeifyError(parsed.error),
  );
  throw new Error("Configuration d'environnement invalide (voir .env.example)");
}

export const env = parsed.data;
