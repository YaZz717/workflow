import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/server/context";
import { TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { PriorityBadge } from "@/components/shared/badges";
import type { PageParams } from "@/types/page";

export default async function ProjectTasksPage({ params }: PageParams<{ projectId: string }>) {
  const { projectId } = await params;

  try {
    await requireProjectAccess(projectId);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }

  const [project, tasks] = await Promise.all([
    prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { key: true } }),
    prisma.task.findMany({
      where: { projectId },
      orderBy: [{ status: "asc" }, { boardOrder: "asc" }, { createdAt: "asc" }],
      include: {
        assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { subtasks: true, comments: true } },
        subtasks: { where: { isDone: true }, select: { id: true } },
      },
    }),
  ]);

  const byStatus = TASK_STATUS_ORDER.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tasks.length} tâche(s) · la vue Kanban avec glisser-déposer arrive en Phase 3
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="Aucune tâche" description="Les tâches de ce projet apparaîtront ici." />
      ) : (
        <div className="space-y-6">
          {byStatus.map(({ status, tasks: group }) =>
            group.length === 0 ? null : (
              <section key={status}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: TASK_STATUS[status].color }} />
                  <h2 className="text-sm font-semibold">{TASK_STATUS[status].label}</h2>
                  <span className="text-xs text-muted-foreground">({group.length})</span>
                </div>
                <Card className="divide-y">
                  {group.map((t) => (
                    <Link
                      key={t.id}
                      href={`/projects/${projectId}/tasks/${t.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {project.key}-{t.number}
                      </span>
                      <span className="flex-1 truncate">{t.title}</span>
                      {t._count.subtasks > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {t.subtasks.length}/{t._count.subtasks}
                        </span>
                      ) : null}
                      {t._count.comments > 0 ? (
                        <Badge variant="muted">{t._count.comments} 💬</Badge>
                      ) : null}
                      <PriorityBadge priority={t.priority} />
                      {t.dueDate ? (
                        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                          {format(t.dueDate, "d MMM", { locale: fr })}
                        </span>
                      ) : null}
                      <div className="flex -space-x-2">
                        {t.assignees.map((a) => (
                          <UserAvatar
                            key={a.user.id}
                            name={a.user.name}
                            image={a.user.image}
                            className="size-6 ring-2 ring-card"
                          />
                        ))}
                      </div>
                    </Link>
                  ))}
                </Card>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
