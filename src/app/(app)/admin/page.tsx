import { Users, Building2, FolderKanban, CheckSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function AdminOverviewPage() {
  const [users, activeUsers, orgs, projects, tasks, timeAgg, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.organization.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.timeEntry.aggregate({ _sum: { durationSec: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { actor: { select: { name: true } }, organization: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Utilisateurs" value={`${activeUsers}/${users}`} icon={Users} hint="actifs / total" />
        <StatCard label="Organisations" value={orgs} icon={Building2} href="/admin/organizations" />
        <StatCard label="Projets" value={projects} icon={FolderKanban} />
        <StatCard label="Tâches" value={tasks} icon={CheckSquare} />
        <StatCard label="Temps total suivi" value={formatDuration(timeAgg._sum.durationSec ?? 0)} icon={Clock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal d&apos;audit — global</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0 text-sm">
          {recent.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
              <div>
                <p>{log.summary}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{log.action}</span>
                  {log.organization ? ` · ${log.organization.name}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(log.createdAt, { addSuffix: true, locale: fr })}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
