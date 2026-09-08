"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type TaskDetail = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimateMinutes: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; key: string; name: string };
  createdBy: { id: string; name: string | null; image: string | null };
  assignees: { user: { id: string; name: string | null; image: string | null; email: string } }[];
  tags: { tag: { id: string; name: string; color: string } }[];
  subtasks: {
    id: string;
    title: string;
    isDone: boolean;
    position: number;
  }[];
  attachments: {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    uploadedBy: { name: string | null };
  }[];
  timeEntries: { durationSec: number; userId: string }[];
  activities: {
    id: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
  }[];
};

export type TaskComment = {
  id: string;
  body: string;
  parentId: string | null;
  editedAt: string | null;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  mentions: { userId: string }[];
};

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async (): Promise<TaskDetail> => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Tâche introuvable");
      return (await res.json()).data.task;
    },
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async (): Promise<TaskComment[]> => {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (!res.ok) return [];
      return (await res.json()).data.comments;
    },
  });
}

/** Applique un patch partiel sur la tâche puis rafraîchit les caches liés. */
export function usePatchTask(taskId: string, projectId: string) {
  const qc = useQueryClient();
  return async (patch: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      toast.error(j?.error?.message ?? "Échec de la mise à jour");
      return false;
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["task", taskId] }),
      qc.invalidateQueries({ queryKey: ["project-board", projectId] }),
      qc.invalidateQueries({ queryKey: ["project-task-list", projectId] }),
    ]);
    return true;
  };
}
