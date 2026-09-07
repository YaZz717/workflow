import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderKanban,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";

import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { getDashboardData } from "@/server/dashboard";
import { formatDuration } from "@/lib/utils";
import { PRIORITY } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  CompletionTrendChart,
  TasksByStatusChart,
  TimePerProjectChart,
} from "@/components/dashboard/charts";

export const metadata: Metadata = { title: "Tableau de bord" };

function dueLabel(date: Date) {
  if (isToday(date)) return "Aujourd'hui";
  if (isTomorrow(date)) return "Demain";
  return format(date, "d MMM", { locale: fr });
}

export default async function DashboardPage() {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const data = await getDashboardData(org.id, user.id);
  const s = data.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour ${user.name?.split(" ")[0] ?? ""} 👋`}
        description={`Voici l'activité de ${org.name}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Projets" value={s.projectCount} icon={FolderKanban} href="/projects" hint={`${s.activeProjectCount} actifs`} />
        <StatCard label="Tâches ouvertes" value={s.openTasks} icon={CircleDot} href="/tasks" />
        <StatCard label="Tâches terminées" value={s.doneTasks} icon={CheckCircle2} accent="success" />
        <StatCard label="En retard" value={s.overdueTasks} icon={AlertTriangle} accent={s.overdueTasks > 0 ? "warning" : "default"} href="/tasks?filter=overdue" />
        <StatCard label="Mes tâches" value={s.myOpenTasks} icon={UserCheck} href="/tasks?filter=mine" />
        <StatCard label="Temps aujourd'hui" value={formatDuration(s.timeTodaySec)} icon={Clock} href="/time" hint={`${formatDuration(s.timeWeekSec)} cette semaine`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tâches terminées — 14 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletionTrendChart data={data.completionTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des tâches</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksByStatusChart data={data.tasksByStatus} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Temps par projet — cette semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <TimePerProjectChart data={data.timePerProject} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prochaines échéances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcoming.length === 0 ? (
              <EmptyState title="Rien à l'horizon" description="Aucune tâche due dans les 7 prochains jours." />
            ) : (
              data.upcoming.map((t) => (
                <Link
                  key={t.id}
                  href={`/projects/${t.project.id}/tasks/${t.id}`}
                  className="flex items-center gap-3 rounded-md border p-2.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: t.project.color }} />
                  <span className="flex-1 truncate">{t.title}</span>
                  <Badge variant="outline" style={{ color: PRIORITY[t.priority].color }}>
                    {PRIORITY[t.priority].label}
                  </Badge>
                  {t.dueDate ? (
                    <span className="shrink-0 text-xs text-muted-foreground">{dueLabel(t.dueDate)}</span>
                  ) : null}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <EmptyState title="Pas encore d'activité" />
            ) : (
              data.recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <UserAvatar name={a.actor?.name} image={a.actor?.image} className="size-6" />
                  <div className="min-w-0">
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
    </div>
  );
}
