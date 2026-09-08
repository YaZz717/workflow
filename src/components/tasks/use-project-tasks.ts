"use client";

import { useQuery } from "@tanstack/react-query";
import type { BoardTask, ProjectMemberLite, TagLite } from "./types";

export function useProjectBoard(projectId: string) {
  return useQuery({
    queryKey: ["project-board", projectId],
    queryFn: async (): Promise<BoardTask[]> => {
      const res = await fetch(`/api/projects/${projectId}/tasks?view=board`);
      if (!res.ok) throw new Error("Échec du chargement");
      const json = await res.json();
      return json.data.tasks;
    },
  });
}

export function useProjectTaskList(projectId: string, searchParams: string) {
  return useQuery({
    queryKey: ["project-task-list", projectId, searchParams],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks?view=list&${searchParams}`);
      if (!res.ok) throw new Error("Échec du chargement");
      return (await res.json()).data as {
        items: BoardTask[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      };
    },
  });
}

export function useOrgTags() {
  return useQuery({
    queryKey: ["org-tags"],
    queryFn: async (): Promise<(TagLite & { _count: { tasks: number } })[]> => {
      const res = await fetch("/api/tags");
      if (!res.ok) return [];
      return (await res.json()).data.tags;
    },
  });
}

export type { BoardTask, ProjectMemberLite, TagLite };
