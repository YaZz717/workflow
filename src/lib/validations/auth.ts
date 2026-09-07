import { z } from "zod";
import { passwordSchema } from "@/lib/auth/password";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nom trop court").max(80),
    email: z.string().email("Email invalide").toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
    organizationName: z.string().min(2, "Nom d'organisation trop court").max(80),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase(),
  password: z.string().min(1, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80),
  image: z.string().url().nullable().optional(),
  timezone: z.string().min(1).max(64).optional(),
  locale: z.enum(["fr", "en"]).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
