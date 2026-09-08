"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TaskDetail } from "./use-task";

export function Subtasks({
  taskId,
  projectId,
  subtasks,
  canEdit,
}: {
  taskId: string;
  projectId: string;
  subtasks: TaskDetail["subtasks"];
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const [adding, setAdding] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const done = subtasks.filter((s) => s.isDone).length;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["task", taskId] });
    qc.invalidateQueries({ queryKey: ["project-board", projectId] });
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!adding.trim() || busy) return;
    setBusy(true);
    const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: adding.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      setAdding("");
      refresh();
    } else toast.error("Échec de l'ajout");
  }

  async function toggle(id: string, isDone: boolean) {
    const res = await fetch(`/api/subtasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone }),
    });
    if (res.ok) refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/subtasks/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Sous-tâches {subtasks.length > 0 ? `— ${done}/${subtasks.length}` : ""}
        </span>
      </div>
      {subtasks.length > 0 ? <Progress value={(done / subtasks.length) * 100} /> : null}

      <ul className="space-y-1">
        {subtasks.map((s) => (
          <li key={s.id} className="group flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.isDone}
              disabled={!canEdit}
              onChange={(e) => toggle(s.id, e.target.checked)}
              className="size-4"
            />
            <span className={s.isDone ? "flex-1 text-muted-foreground line-through" : "flex-1"}>
              {s.title}
            </span>
            {canEdit ? (
              <button
                onClick={() => remove(s.id)}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {canEdit ? (
        <form onSubmit={add} className="flex gap-2 pt-1">
          <Input
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            placeholder="Ajouter une sous-tâche…"
            className="h-8"
          />
          <Button type="submit" size="icon" variant="outline" className="size-8 shrink-0" disabled={busy || !adding.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
