import { z } from "zod";

export const manualEntrySchema = z.object({
  taskId: z.string().min(1),
  date: z.string().min(1), // "YYYY-MM-DD"
  durationMinutes: z.coerce.number().int().min(1).max(24 * 60),
  description: z.string().max(500).optional().or(z.literal("")),
  billable: z.boolean().optional(),
});

export const updateEntrySchema = z.object({
  durationMinutes: z.coerce.number().int().min(1).max(24 * 60).optional(),
  description: z.string().max(500).nullable().optional(),
  date: z.string().min(1).optional(),
  billable: z.boolean().optional(),
});

export const timeEntriesQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  projectId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const timeStatsQuerySchema = z.object({
  range: z.enum(["today", "week", "month"]).default("week"),
  scope: z.enum(["me", "team"]).default("me"),
});
