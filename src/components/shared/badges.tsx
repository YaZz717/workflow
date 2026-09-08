import type { Priority, ProjectStatus, TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { PRIORITY, PROJECT_STATUS, TASK_STATUS } from "@/lib/constants";

function Dot({ color }: { color: string }) {
  return <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const s = PROJECT_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{ color: s.color, borderColor: `${s.color}55` }}
    >
      <Dot color={s.color} />
      {s.label}
    </span>
  );
}

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const s = TASK_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{ color: s.color, borderColor: `${s.color}55` }}
    >
      <Dot color={s.color} />
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const p = PRIORITY[priority];
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs font-medium", className)}
      style={{ color: p.color }}
      title={`Priorité : ${p.label}`}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <rect x="0" y="6" width="2.5" height="4" fill="currentColor" opacity={p.rank >= 1 ? 1 : 0.25} />
        <rect x="3.75" y="3" width="2.5" height="7" fill="currentColor" opacity={p.rank >= 2 ? 1 : 0.25} />
        <rect x="7.5" y="0" width="2.5" height="10" fill="currentColor" opacity={p.rank >= 3 ? 1 : 0.25} />
      </svg>
      {p.label}
    </span>
  );
}
