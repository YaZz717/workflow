import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/server/context";
import { formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/avatar";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import type { PageParams } from "@/types/page";

export default async function TaskDetailPage({
  params,
}: PageParams<{ projectId: string; taskId: string }>) {
  const { projectId, taskId } = await params;

  try {
    await requireProjectAccess(projectId);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, key: true, name: true } },
      createdBy: { select: { name: true } },
      assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
      tags: { include: { tag: true } },
      subtasks: { orderBy: { position: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      },
      timeEntries: { select: { durationSec: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!task || task.projectId !== projectId) notFound();

  const doneSub = task.subtasks.filter((s) => s.isDone).length;
  const totalTime = task.timeEntries.reduce((sum, e) => sum + e.durationSec, 0);

  return (
    <div className="space-y-4">
      <Link
        href={`/projects/${projectId}/tasks`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Toutes les tâches
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {task.project.key}-{task.number}
            </p>
            <h1 className="mt-1 text-xl font-semibold">{task.title}</h1>
          </div>

          {task.description ? (
            <Card>
              <CardContent className="whitespace-pre-wrap pt-6 text-sm leading-relaxed">
                {task.description}
              </CardContent>
            </Card>
          ) : null}

          {task.subtasks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Sous-tâches — {doneSub}/{task.subtasks.length} terminées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={(doneSub / task.subtasks.length) * 100} />
                <ul className="space-y-1 pt-2">
                  {task.subtasks.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={s.isDone} readOnly className="pointer-events-none" />
                      <span className={s.isDone ? "text-muted-foreground line-through" : ""}>
                        {s.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-4" /> Commentaires ({task.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun commentaire.</p>
              ) : (
                task.comments.map((c) => (
                  <div key={c.id} className="flex gap-3 text-sm">
                    <UserAvatar name={c.author.name} image={c.author.image} className="size-7" />
                    <div>
                      <p>
                        <span className="font-medium">{c.author.name}</span>{" "}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(c.createdAt, { addSuffix: true, locale: fr })}
                        </span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{c.body}</p>
                    </div>
                  </div>
                ))
              )}
              <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                Ajout de commentaires, mentions @ et édition : Phase 3.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <Row label="Statut">
                <TaskStatusBadge status={task.status} />
              </Row>
              <Row label="Priorité">
                <PriorityBadge priority={task.priority} />
              </Row>
              <Row label="Assigné à">
                {task.assignees.length === 0 ? (
                  <span className="text-muted-foreground">Personne</span>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    {task.assignees.map((a) => (
                      <span key={a.user.id} className="inline-flex items-center gap-1.5">
                        {a.user.name}
                        <UserAvatar name={a.user.name} image={a.user.image} className="size-5" />
                      </span>
                    ))}
                  </div>
                )}
              </Row>
              <Row label="Créée par">{task.createdBy.name}</Row>
              <Row label="Échéance">
                {task.dueDate ? format(task.dueDate, "d MMM yyyy", { locale: fr }) : "—"}
              </Row>
              <Row label="Estimation">
                {task.estimateMinutes ? formatDuration(task.estimateMinutes * 60) : "—"}
              </Row>
              <Row label="Temps passé">{totalTime > 0 ? formatDuration(totalTime) : "—"}</Row>
              {task.tags.length > 0 ? (
                <Row label="Tags">
                  <div className="flex flex-wrap justify-end gap-1">
                    {task.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </Row>
              ) : null}
            </CardContent>
          </Card>

          {task.activities.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Historique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {task.activities.map((a) => (
                  <p key={a.id}>
                    {a.field} : {a.oldValue ?? "∅"} → {a.newValue ?? "∅"}{" "}
                    <span className="opacity-70">
                      ({formatDistanceToNow(a.createdAt, { addSuffix: true, locale: fr })})
                    </span>
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
