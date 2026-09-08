import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  content: z.string().max(200_000).optional().or(z.literal("")),
  projectId: z.string().min(1).nullable().optional(),
  folderId: z.string().min(1).nullable().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(200_000).optional(),
  folderId: z.string().min(1).nullable().optional(),
  isArchived: z.boolean().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, "Nom requis").max(80),
  projectId: z.string().min(1).nullable().optional(),
  parentId: z.string().min(1).nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  parentId: z.string().min(1).nullable().optional(),
});

export const documentListQuerySchema = z.object({
  projectId: z.string().min(1).optional(),
  folderId: z.string().min(1).optional(),
  scope: z.enum(["all", "general", "project"]).default("all"),
  q: z.string().max(100).optional(),
  archived: z.enum(["1"]).optional(),
});
