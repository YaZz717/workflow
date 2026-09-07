import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  endOfDay,
  addDays,
  format,
} from "date-fns";

import { prisma } from "@/lib/prisma";

/**
 * Agrège toutes les statistiques du tableau de bord pour une organisation
 * et un utilisateur donnés. Une seule fonction => une seule série de requêtes.
 */
export async function getDashboardData(organizationId: string, userId: string) {
  const now = new Date();
  const today = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const projectScope = { project: { organizationId } };

  const [
    projectCount,
    activeProjectCount,
    openTasks,
    doneTasks,
    overdueTasks,
    myOpenTasks,
    timeToday,
    timeWeek,
    timeMonth,
    upcoming,
    recentActivity,
    tasksByStatus,
    timePerProject,
  ] = await Promise.all([
    prisma.project.count({ where: { organizationId } }),
    prisma.project.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.task.count({ where: { ...projectScope, status: { not: "DONE" } } }),
    prisma.task.count({ where: { ...projectScope, status: "DONE" } }),
    prisma.task.count({
      where: { ...projectScope, status: { not: "DONE" }, dueDate: { lt: today } },
    }),
    prisma.task.count({
      where: { ...projectScope, status: { not: "DONE" }, assignees: { some: { userId } } },
    }),
    sumDuration(organizationId, userId, today),
    sumDuration(organizationId, userId, weekStart),
    sumDuration(organizationId, userId, monthStart),
    prisma.task.findMany({
      where: {
        ...projectScope,
        status: { not: "DONE" },
        dueDate: { gte: today, lte: endOfDay(addDays(now, 7)) },
      },
      orderBy: { dueDate: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        number: true,
        dueDate: true,
        priority: true,
        project: { select: { id: true, key: true, color: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { id: true, name: true, image: true } } },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: projectScope,
      _count: { _all: true },
    }),
    timePerProjectThisWeek(organizationId, weekStart),
  ]);

  // Série "tâches terminées par jour" sur 14 jours
  const since = subDays(today, 13);
  const completed = await prisma.task.findMany({
    where: { ...projectScope, status: "DONE", completedAt: { gte: since } },
    select: { completedAt: true },
  });
  const completionTrend = buildDailySeries(since, 14, completed.map((t) => t.completedAt));

  return {
    stats: {
      projectCount,
      activeProjectCount,
      openTasks,
      doneTasks,
      overdueTasks,
      myOpenTasks,
      timeTodaySec: timeToday,
      timeWeekSec: timeWeek,
      timeMonthSec: timeMonth,
    },
    upcoming,
    recentActivity,
    tasksByStatus: tasksByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    completionTrend,
    timePerProject,
  };
}

async function sumDuration(organizationId: string, userId: string, since: Date): Promise<number> {
  const res = await prisma.timeEntry.aggregate({
    where: {
      userId,
      startedAt: { gte: since },
      task: { project: { organizationId } },
    },
    _sum: { durationSec: true },
  });
  return res._sum.durationSec ?? 0;
}

async function timePerProjectThisWeek(organizationId: string, weekStart: Date) {
  const entries = await prisma.timeEntry.findMany({
    where: { startedAt: { gte: weekStart }, task: { project: { organizationId } } },
    select: { durationSec: true, task: { select: { project: { select: { id: true, name: true, color: true } } } } },
  });
  const map = new Map<string, { name: string; color: string; seconds: number }>();
  for (const e of entries) {
    const p = e.task.project;
    const cur = map.get(p.id) ?? { name: p.name, color: p.color, seconds: 0 };
    cur.seconds += e.durationSec;
    map.set(p.id, cur);
  }
  return [...map.values()].sort((a, b) => b.seconds - a.seconds).slice(0, 6);
}

function buildDailySeries(start: Date, days: number, dates: (Date | null)[]) {
  const buckets: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    buckets[format(addDays(start, i), "yyyy-MM-dd")] = 0;
  }
  for (const d of dates) {
    if (!d) continue;
    const key = format(d, "yyyy-MM-dd");
    if (key in buckets) buckets[key] += 1;
  }
  return Object.entries(buckets).map(([date, count]) => ({
    date,
    label: format(new Date(date), "dd/MM"),
    count,
  }));
}
