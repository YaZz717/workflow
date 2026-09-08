"use client";

import * as React from "react";
import { LayoutGrid, List, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TASK_STATUS, PRIORITY } from "@/lib/constants";
import { TaskBoard } from "./task-board";
import { TaskList } from "./task-list";
import { CreateTaskDialog } from "./create-task-dialog";
import { useProjectTaskList } from "./use-project-tasks";
import type { ProjectMemberLite } from "./types";

export function ProjectTasksView({
  projectId,
  members,
  canEdit,
  canManageTags,
}: {
  projectId: string;
  members: ProjectMemberLite[];
  canEdit: boolean;
  canManageTags: boolean;
}) {
  const [view, setView] = React.useState<"board" | "list">("board");
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [sort, setSort] = React.useState("created");
  const [page, setPage] = React.useState(1);

  const [debouncedQ, setDebouncedQ] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams();
  if (debouncedQ) params.set("q", debouncedQ);
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (assigneeId) params.set("assigneeId", assigneeId);
  if (sort) params.set("sort", sort);
  params.set("page", String(page));

  const list = useProjectTaskList(projectId, params.toString());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border p-0.5">
          <button
            onClick={() => setView("board")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium",
              view === "board" ? "bg-secondary" : "text-muted-foreground",
            )}
          >
            <LayoutGrid className="size-4" /> Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium",
              view === "list" ? "bg-secondary" : "text-muted-foreground",
            )}
          >
            <List className="size-4" /> Liste
          </button>
        </div>

        {view === "list" ? (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher…"
                className="h-9 w-48 pl-8"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Tous statuts</option>
              {Object.entries(TASK_STATUS).map(([v, s]) => (
                <option key={v} value={v}>{s.label}</option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Toutes priorités</option>
              {Object.entries(PRIORITY).map(([v, p]) => (
                <option key={v} value={v}>{p.label}</option>
              ))}
            </select>
            <select
              value={assigneeId}
              onChange={(e) => { setAssigneeId(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Tous les assignés</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="created">Récentes</option>
              <option value="due">Échéance</option>
              <option value="priority">Priorité</option>
              <option value="updated">Mises à jour</option>
            </select>
          </>
        ) : null}

        {canEdit ? (
          <div className="ml-auto">
            <CreateTaskDialog projectId={projectId} members={members} canManageTags={canManageTags} />
          </div>
        ) : null}
      </div>

      {view === "board" ? (
        <TaskBoard projectId={projectId} canEdit={canEdit} />
      ) : list.isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : list.data ? (
        <TaskList
          items={list.data.items}
          pagination={list.data.pagination}
          onPage={setPage}
          hrefFor={(t) => `/projects/${projectId}/tasks/${t.id}`}
        />
      ) : null}
    </div>
  );
}
