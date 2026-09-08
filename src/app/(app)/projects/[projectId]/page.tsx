import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CheckCircle2, AlertTriangle, FileText, ListTodo } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { ApiError } from "@/lib/http";
import { getProjectOverview } from "@/server/projects";
import { TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import type { PageParams } from "@/types/page";

export default async function ProjectOverviewPage({ params }: PageParams<{ projectId: string }>) {
  const { projectId } = await params;

  let data;
  try {
    data = await getProjectOverview(projectId);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }

  const { project, stats, recentActivity, upcoming } = data;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat icon={ListTodo} label="Tâches" value={stats.taskCount} />
          <MiniStat icon={CheckCircle2} label="Terminées" value={stats.doneCount} accent="text-success" />
          <MiniStat
            icon={AlertTriangle}
            label="En retard"
            value={stats.overdue}
            accent={stats.overdue > 0 ? "text-warning" : undefined}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Avancement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stats.progress}% terminé</span>
              <span className="text-muted-foreground">
                {stats.doneCount}/{stats.taskCount}
              </span>
            </div>
            <Progress value={stats.progress} />
            <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-5">
              {TASK_STATUS_ORDER.map((s) => (
                <div key={s} className="rounded-md border p-2 text-center">
                  <p className="text-lg font-semibold tabular-nums">{stats.statusCounts[s] ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">{TASK_STATUS[s].label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <UserAvatar name={a.actor?.name} image={a.actor?.image} className="size-6" />
                  <div>
                    <p className="leading-snug">{a.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(a.createdAt, { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail label="Responsable">
              {project.lead ? (
                <span className="inline-flex items-center gap-2">
                  <UserAvatar name={project.lead.name} image={project.lead.image} className="size-5" />
                  {project.lead.name}
                </span>
              ) : (
                <span className="text-muted-foreground">Non défini</span>
              )}
            </Detail>
            <Detail label="Priorité">
              <PriorityBadge priority={project.priority} />
            </Detail>
            <Detail label="Début">
              {project.startDate ? format(project.startDate, "d MMM yyyy", { locale: fr }) : "—"}
            </Detail>
            <Detail label="Fin">
              {project.endDate ? format(project.endDate, "d MMM yyyy", { locale: fr }) : "—"}
            </Detail>
            <Detail label="Membres">{project.members.length}</Detail>
            <Detail label="Documents">
              <Link href={`/projects/${projectId}/documents`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <FileText className="size-3.5" /> {stats.documentCount}
              </Link>
            </Detail>
            <Detail label="Créé par">{project.createdBy.name}</Detail>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prochaines échéances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <EmptyState title="Aucune échéance" />
            ) : (
              upcoming.map((t) => (
                <Link
                  key={t.id}
                  href={`/projects/${projectId}/tasks/${t.id}`}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent"
                >
                  <span className="flex-1 truncate">{t.title}</span>
                  <TaskStatusBadge status={t.status} />
                  {t.dueDate ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      {format(t.dueDate, "d MMM", { locale: fr })}
                    </span>
                  ) : null}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
