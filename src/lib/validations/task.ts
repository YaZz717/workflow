import { z } from "zod";

export const TASK_STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

/**
 * Champ date à 3 états :
 *  - absent (undefined)  → ne pas modifier
 *  - null / ""            → effacer la date
 *  - "YYYY-MM-DD"         → définir la date
 */
const dateInput = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === null || v === "") return null;
    return new Date(v);
  })
  .refine(
    (d) => d === undefined || d === null || !Number.isNaN(d.getTime()),
    "Date invalide",
  );

export const createTaskSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().max(10_000).optional().or(z.literal("")),
  status: z.enum(TASK_STATUSES).default("BACKLOG"),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
  assigneeIds: z.array(z.string().min(1)).max(10).default([]),
  tagIds: z.array(z.string().min(1)).max(20).default([]),
  dueDate: dateInput,
  estimateMinutes: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeIds: z.array(z.string().min(1)).max(10).optional(),
  tagIds: z.array(z.string().min(1)).max(20).optional(),
  dueDate: dateInput,
  estimateMinutes: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
});

/** Déplacement Kanban : nouvelle colonne + voisins pour recalculer boardOrder. */
export const moveTaskSchema = z.object({
  status: z.enum(TASK_STATUSES),
  beforeId: z.string().min(1).nullable().optional(),
  afterId: z.string().min(1).nullable().optional(),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isDone: z.boolean().optional(),
  position: z.number().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, "Commentaire vide").max(5000),
  parentId: z.string().min(1).nullable().optional(),
  mentionIds: z.array(z.string().min(1)).max(20).default([]),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  mentionIds: z.array(z.string().min(1)).max(20).default([]),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#94a3b8"),
});

export const taskListQuerySchema = z.object({
  view: z.enum(["board", "list"]).default("board"),
  q: z.string().max(100).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: z.string().min(1).optional(),
  tagId: z.string().min(1).optional(),
  sort: z.enum(["created", "due", "priority", "updated"]).default("created"),
  page: z.coerce.number().int().min(1).default(1),
});

export const myTasksQuerySchema = z.object({
  scope: z.enum(["assigned", "created", "all"]).default("assigned"),
  status: z.enum(TASK_STATUSES).optional(),
  projectId: z.string().min(1).optional(),
  overdue: z.enum(["1"]).optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(["due", "priority", "created", "updated"]).default("due"),
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
