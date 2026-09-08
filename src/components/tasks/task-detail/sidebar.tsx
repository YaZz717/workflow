"use client";

import * as React from "react";
import { format } from "date-fns";

import { TASK_STATUS, PRIORITY } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AssigneePicker } from "../assignee-picker";
import { TagPicker } from "../tag-picker";
import type { TaskDetail } from "./use-task";
import type { ProjectMemberLite } from "../types";

export function TaskSidebar({
  task,
  members,
  canEdit,
  canManageTags,
  patch,
  totalTimeSec,
}: {
  task: TaskDetail;
  members: ProjectMemberLite[];
  canEdit: boolean;
  canManageTags: boolean;
  patch: (p: Record<string, unknown>) => Promise<boolean>;
  totalTimeSec: number;
}) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 text-sm">
      <Row label="Statut">
        <select
          value={task.status}
          disabled={!canEdit}
          onChange={(e) => patch({ status: e.target.value })}
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
        >
          {Object.entries(TASK_STATUS).map(([v, s]) => (
            <option key={v} value={v}>
              {s.label}
            </option>
          ))}
        </select>
      </Row>

      <Row label="Priorité">
        <select
          value={task.priority}
          disabled={!canEdit}
          onChange={(e) => patch({ priority: e.target.value })}
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
        >
          {Object.entries(PRIORITY).map(([v, p]) => (
            <option key={v} value={v}>
              {p.label}
            </option>
          ))}
        </select>
      </Row>

      <Row label="Assignés" stack>
        <AssigneePicker
          members={members}
          value={task.assignees.map((a) => a.user.id)}
          disabled={!canEdit}
          onChange={(ids) => patch({ assigneeIds: ids })}
        />
      </Row>

      <Row label="Tags" stack>
        <TagPicker
          value={task.tags.map((t) => t.tag.id)}
          disabled={!canEdit}
          canCreate={canManageTags}
          onChange={(ids) => patch({ tagIds: ids })}
        />
      </Row>

      <Row label="Échéance">
        <Input
          type="date"
          disabled={!canEdit}
          defaultValue={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
          onChange={(e) => patch({ dueDate: e.target.value || null })}
          className="h-8 text-xs"
        />
      </Row>

      <Row label="Estimation (h)">
        <Input
          type="number"
          min={0}
          step={0.5}
          disabled={!canEdit}
          defaultValue={task.estimateMinutes ? task.estimateMinutes / 60 : ""}
          onBlur={(e) =>
            patch({ estimateMinutes: e.target.value ? Number(e.target.value) * 60 : null })
          }
          className="h-8 text-xs"
        />
      </Row>

      <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
        <p>Temps passé : {totalTimeSec > 0 ? formatDuration(totalTimeSec) : "—"}</p>
        <p>Créée par {task.createdBy.name}</p>
        <p>Le {format(new Date(task.createdAt), "dd/MM/yyyy")}</p>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  stack,
}: {
  label: string;
  children: React.ReactNode;
  stack?: boolean;
}) {
  return (
    <div className={stack ? "space-y-1" : "grid grid-cols-[90px_1fr] items-center gap-2"}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
