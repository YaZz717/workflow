import { z } from "zod";

export const PROJECT_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const PROJECT_ROLES = ["LEAD", "MEMBER", "VIEWER"] as const;

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale invalide")
  .default("#6366f1");

const dateInput = z
  .string()
  .optional()
  .transform((v) => (v && v.length ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Date invalide");

export const createProjectSchema = z
  .object({
    name: z.string().min(2, "Nom trop court").max(120),
    key: z
      .string()
      .regex(/^[A-Z][A-Z0-9]{1,5}$/, "2 à 6 lettres majuscules/chiffres, commençant par une lettre")
      .optional(),
    description: z.string().max(2000).optional().or(z.literal("")),
    color: hexColor,
    priority: z.enum(PRIORITIES).default("MEDIUM"),
    status: z.enum(PROJECT_STATUSES).default("PLANNING"),
    startDate: dateInput,
    endDate: dateInput,
    leadId: z.string().min(1).optional().or(z.literal("")),
    memberIds: z.array(z.string().min(1)).default([]),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
    { message: "La date de fin doit être après la date de début", path: ["endDate"] },
  );

export const updateProjectSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    priority: z.enum(PRIORITIES).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    startDate: dateInput,
    endDate: dateInput,
    leadId: z.string().min(1).nullable().optional(),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
    { message: "La date de fin doit être après la date de début", path: ["endDate"] },
  );

export const projectMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(PROJECT_ROLES).default("MEMBER"),
});

export const projectListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  sort: z.enum(["recent", "name", "priority", "endDate"]).default("recent"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
