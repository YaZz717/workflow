"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/constants";
import { TaskCard } from "./task-card";
import { useProjectBoard } from "./use-project-tasks";
import type { BoardTask } from "./types";
import type { TaskStatus } from "@prisma/client";

type Columns = Record<string, BoardTask[]>;

function groupByStatus(tasks: BoardTask[]): Columns {
  const cols: Columns = {};
  for (const s of TASK_STATUS_ORDER) cols[s] = [];
  for (const t of [...tasks].sort((a, b) => a.boardOrder - b.boardOrder)) {
    (cols[t.status] ??= []).push(t);
  }
  return cols;
}

function SortableTaskCard({ task, projectId }: { task: BoardTask; projectId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} href={`/projects/${projectId}/tasks/${task.id}`} />
    </div>
  );
}

function Column({
  status,
  tasks,
  projectId,
}: {
  status: string;
  tasks: BoardTask[];
  projectId: string;
}) {
  const meta = TASK_STATUS[status as TaskStatus];
  const { setNodeRef } = useSortable({ id: `col-${status}`, data: { type: "column", status } });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-secondary/40">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="size-2 rounded-full" style={{ background: meta.color }} />
        <span className="text-sm font-semibold">{meta.label}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto px-2 pb-2 scrollbar-thin">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} projectId={projectId} />
          ))}
        </SortableContext>
        {tasks.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            Déposez une tâche ici
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function TaskBoard({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const { data, isLoading } = useProjectBoard(projectId);
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = React.useState<BoardTask | null>(null);

  // État local éditable du board, resynchronisé quand les données serveur
  // changent — pattern React « ajuster l'état pendant le rendu » via une clé.
  const [snapshot, setSnapshot] = React.useState<{
    source: BoardTask[] | undefined;
    columns: Columns;
  }>({ source: data, columns: data ? groupByStatus(data) : {} });

  if (data !== snapshot.source) {
    setSnapshot({ source: data, columns: data ? groupByStatus(data) : {} });
  }
  const { columns } = snapshot;
  const setColumns = (updater: React.SetStateAction<Columns>) =>
    setSnapshot((s) => ({
      ...s,
      columns: typeof updater === "function" ? (updater as (c: Columns) => Columns)(s.columns) : updater,
    }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findColumn(id: string): string | undefined {
    if (id.startsWith("col-")) return id.slice(4);
    return Object.keys(columns).find((s) => columns[s].some((t) => t.id === id));
  }

  function onDragStart(e: DragStartEvent) {
    const t = e.active.data.current?.task as BoardTask | undefined;
    if (t) setActiveTask(t);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findColumn(active.id as string);
    const to = findColumn(over.id as string);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const item = prev[from].find((t) => t.id === active.id);
      if (!item) return prev;
      const overIndex = prev[to].findIndex((t) => t.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : prev[to].length;
      return {
        ...prev,
        [from]: prev[from].filter((t) => t.id !== active.id),
        [to]: [
          ...prev[to].slice(0, insertAt),
          { ...item, status: to as BoardTask["status"] },
          ...prev[to].slice(insertAt),
        ],
      };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const to = findColumn(over.id as string);
    if (!to) return;

    // Réordonner dans la colonne d'arrivée (updater pur, sans effet de bord)
    const list = columns[to] ?? [];
    const oldIndex = list.findIndex((t) => t.id === active.id);
    if (oldIndex < 0) return;
    let newIndex = list.findIndex((t) => t.id === over.id);
    if (newIndex < 0) newIndex = list.length - 1;
    const next = [...list];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    setColumns((prev) => ({ ...prev, [to]: next }));
    void persist(active.id as string, to, next);
  }

  async function persist(taskId: string, status: string, list: BoardTask[]) {
    const idx = list.findIndex((t) => t.id === taskId);
    const beforeId = idx > 0 ? list[idx - 1].id : null;
    const afterId = idx < list.length - 1 ? list[idx + 1].id : null;
    try {
      const res = await fetch(`/api/tasks/${taskId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, beforeId, afterId }),
      });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ["project-board", projectId] });
    } catch {
      toast.error("Le déplacement a échoué");
      qc.invalidateQueries({ queryKey: ["project-board", projectId] });
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {TASK_STATUS_ORDER.map((s) => (
          <div key={s} className="h-64 w-72 shrink-0 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const board = (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {TASK_STATUS_ORDER.map((status) => (
        <Column key={status} status={status} tasks={columns[status] ?? []} projectId={projectId} />
      ))}
    </div>
  );

  if (!canEdit) return board;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {board}
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} href="#" dragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
