"use client";

import Link from "next/link";
import { MessageSquare, Paperclip, CheckSquare, CalendarClock } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/shared/badges";
import type { BoardTask } from "./types";

export function TaskCard({
  task,
  href,
  dragging,
}: {
  task: BoardTask;
  href: string;
  dragging?: boolean;
}) {
  const overdue =
    task.dueDate && task.status !== "DONE" && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md",
        dragging && "opacity-60 shadow-lg ring-2 ring-primary",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          {task.project.key}-{task.number}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      <p className="mt-1 line-clamp-3 font-medium">{task.title}</p>

      {task.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${t.color}22`, color: t.color }}
            >
              {t.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {task.subtaskTotal > 0 ? (
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="size-3.5" />
            {task.subtaskDone}/{task.subtaskTotal}
          </span>
        ) : null}
        {task.commentCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {task.commentCount}
          </span>
        ) : null}
        {task.attachmentCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="size-3.5" />
            {task.attachmentCount}
          </span>
        ) : null}
        {task.dueDate ? (
          <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-destructive")}>
            <CalendarClock className="size-3.5" />
            {format(new Date(task.dueDate), "d MMM", { locale: fr })}
          </span>
        ) : null}

        <div className="ml-auto flex -space-x-2">
          {task.assignees.slice(0, 3).map((a) => (
            <UserAvatar key={a.id} name={a.name} image={a.image} className="size-6 ring-2 ring-card" />
          ))}
        </div>
      </div>
    </Link>
  );
}
