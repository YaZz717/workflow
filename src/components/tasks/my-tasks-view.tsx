"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TASK_STATUS } from "@/lib/constants";
import { TaskList } from "./task-list";
import type { BoardTask } from "./types";

const SCOPES = [
  { value: "assigned", label: "Assignées à moi" },
  { value: "created", label: "Créées par moi" },
  { value: "all", label: "Toutes (moi)" },
] as const;

export function MyTasksView({
  projects,
  initialScope,
  initialOverdue,
}: {
  projects: { id: string; name: string; key: string }[];
  initialScope?: string;
  initialOverdue?: boolean;
}) {
  const [scope, setScope] = React.useState(initialScope ?? "assigned");
  const [status, setStatus] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [overdue, setOverdue] = React.useState(!!initialOverdue);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("due");
  const [page, setPage] = React.useState(1);

  const [dq, setDq] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams();
  params.set("scope", scope);
  if (status) params.set("status", status);
  if (projectId) params.set("projectId", projectId);
  if (overdue) params.set("overdue", "1");
  if (dq) params.set("q", dq);
  params.set("sort", sort);
  params.set("page", String(page));

  const { data, isLoading } = useQuery({
    queryKey: ["my-tasks", params.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error();
      return (await res.json()).data as {
        items: BoardTask[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      };
    },
  });

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border p-0.5">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => resetPage(setScope)(s.value)}
              className={cn(
                "rounded px-2.5 py-1 text-sm font-medium",
                scope === s.value ? "bg-secondary" : "text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Rechercher…"
            className="h-9 w-44 pl-8"
          />
        </div>

        <select
          value={projectId}
          onChange={(e) => resetPage(setProjectId)(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Tous les projets</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Tous statuts</option>
          {Object.entries(TASK_STATUS).map(([v, s]) => (
            <option key={v} value={v}>
              {s.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => resetPage(setOverdue)(e.target.checked)}
          />
          En retard
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="due">Échéance</option>
          <option value="priority">Priorité</option>
          <option value="created">Récentes</option>
          <option value="updated">Mises à jour</option>
        </select>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : data ? (
        <TaskList
          items={data.items}
          pagination={data.pagination}
          onPage={setPage}
          hrefFor={(t) => `/projects/${t.project.id}/tasks/${t.id}`}
          showProject
        />
      ) : null}
    </div>
  );
}
