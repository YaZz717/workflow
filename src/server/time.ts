import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/http";
import { requireProjectAccess, requireTaskAccess } from "@/server/context";
import { orgRoleAtLeast } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

export async function getRunningTimer(userId: string) {
  const entry = await prisma.timeEntry.findFirst({
    where: { userId, isRunning: true },
    include: { task: { select: { id: true, title: true, projectId: true } } },
    orderBy: { startedAt: "desc" },
  });
  if (!entry) return null;
  return {
    id: entry.id,
    taskId: entry.task.id,
    taskTitle: entry.task.title,
    projectId: entry.task.projectId,
    startedAt: entry.startedAt.toISOString(),
  };
}

/** Démarre un chronomètre sur une tâche (arrête tout chrono en cours). */
export async function startTimer(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw Errors.notFound("Tâche introuvable");
  await requireProjectAccess(task.projectId); // vérifie l'accès + IDOR

  return prisma.$transaction(async (tx) => {
    const running = await tx.timeEntry.findMany({ where: { userId, isRunning: true } });
    for (const r of running) {
      const durationSec = Math.max(0, Math.round((Date.now() - r.startedAt.getTime()) / 1000));
      await tx.timeEntry.update({
        where: { id: r.id },
        data: { isRunning: false, endedAt: new Date(), durationSec },
      });
    }
    return tx.timeEntry.create({
      data: { userId, taskId, startedAt: new Date(), isRunning: true, source: "timer" },
    });
  });
}

export async function stopTimer(userId: string) {
  const running = await prisma.timeEntry.findFirst({
    where: { userId, isRunning: true },
    orderBy: { startedAt: "desc" },
  });
  if (!running) return null;
  const durationSec = Math.max(0, Math.round((Date.now() - running.startedAt.getTime()) / 1000));
  return prisma.timeEntry.update({
    where: { id: running.id },
    data: { isRunning: false, endedAt: new Date(), durationSec },
  });
}

// ---------------------------------------------------------------------------
// Saisie manuelle & gestion des entrées
// ---------------------------------------------------------------------------

type Actor = { id: string; name: string | null };

export async function addManualEntry(
  actor: Actor,
  input: { taskId: string; date: string; durationMinutes: number; description?: string },
) {
  const { task, project, projectRole } = await requireTaskAccess(input.taskId);
  if (projectRole === "VIEWER") throw Errors.forbidden();

  const startedAt = new Date(`${input.date}T09:00:00`);
  if (Number.isNaN(startedAt.getTime())) throw Errors.badRequest("Date invalide");
  const durationSec = input.durationMinutes * 60;

  const entry = await prisma.timeEntry.create({
    data: {
      taskId: input.taskId,
      userId: actor.id,
      description: input.description || null,
      startedAt,
      endedAt: new Date(startedAt.getTime() + durationSec * 1000),
      durationSec,
      isRunning: false,
      source: "manual",
    },
  });
  await recordAudit({
    organizationId: project.organizationId,
    actorId: actor.id,
    action: "time.manual_add",
    resourceType: "Task",
    resourceId: input.taskId,
    summary: `${actor.name} a ajouté ${input.durationMinutes} min sur ${project.key}-${task.number}`,
  });
  return entry;
}

async function loadEntryForWrite(actor: Actor, entryId: string) {
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw Errors.notFound();
  const { orgRole } = await requireTaskAccess(entry.taskId);
  const isOwner = entry.userId === actor.id;
  if (!isOwner && !orgRoleAtLeast(orgRole, "MANAGER")) throw Errors.forbidden();
  return entry;
}

export async function updateEntry(
  actor: Actor,
  entryId: string,
  patch: { durationMinutes?: number; description?: string | null; date?: string },
) {
  const entry = await loadEntryForWrite(actor, entryId);
  if (entry.isRunning) throw Errors.badRequest("Impossible de modifier un chrono en cours.");

  const startedAt = patch.date ? new Date(`${patch.date}T09:00:00`) : entry.startedAt;
  const durationSec = patch.durationMinutes ? patch.durationMinutes * 60 : entry.durationSec;

  return prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      description: patch.description === undefined ? undefined : patch.description,
      startedAt,
      endedAt: new Date(startedAt.getTime() + durationSec * 1000),
      durationSec,
    },
  });
}

export async function deleteEntry(actor: Actor, entryId: string) {
  await loadEntryForWrite(actor, entryId);
  await prisma.timeEntry.delete({ where: { id: entryId } });
}

// ---------------------------------------------------------------------------
// Liste & statistiques
// ---------------------------------------------------------------------------

const PAGE = 30;

export async function listEntries(
  organizationId: string,
  currentUserId: string,
  isManager: boolean,
  filters: { from?: string; to?: string; projectId?: string; userId?: string; page?: number },
) {
  const page = Math.max(1, filters.page ?? 1);
  const where: import("@prisma/client").Prisma.TimeEntryWhereInput = {
    // Toujours borné à l'organisation (anti-IDOR), + filtre projet éventuel.
    task: {
      projectId: filters.projectId || undefined,
      project: { organizationId },
    },
    isRunning: false,
    // Les non-managers ne voient que leurs entrées.
    userId: isManager ? filters.userId || undefined : currentUserId,
    ...(filters.from || filters.to
      ? {
          startedAt: {
            ...(filters.from ? { gte: startOfDay(new Date(filters.from)) } : {}),
            ...(filters.to ? { lte: endOfDay(new Date(filters.to)) } : {}),
          },
        }
      : {}),
  };

  const [rows, total, sum] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: {
        user: { select: { id: true, name: true, image: true } },
        task: {
          select: { id: true, number: true, title: true, project: { select: { id: true, key: true, name: true, color: true } } },
        },
      },
    }),
    prisma.timeEntry.count({ where }),
    prisma.timeEntry.aggregate({ where, _sum: { durationSec: true } }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      durationSec: r.durationSec,
      description: r.description,
      source: r.source,
      startedAt: r.startedAt.toISOString(),
      user: r.user,
      task: {
        id: r.task.id,
        ref: `${r.task.project.key}-${r.task.number}`,
        title: r.task.title,
        project: r.task.project,
      },
    })),
    pagination: { page, pageSize: PAGE, total, totalPages: Math.max(1, Math.ceil(total / PAGE)) },
    totalSec: sum._sum.durationSec ?? 0,
  };
}

function rangeBounds(range: "today" | "week" | "month") {
  const now = new Date();
  if (range === "today") return { from: startOfDay(now), to: endOfDay(now) };
  if (range === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
  return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
}

export async function getTimeStats(
  organizationId: string,
  currentUserId: string,
  isManager: boolean,
  range: "today" | "week" | "month",
  scope: "me" | "team",
) {
  const team = scope === "team" && isManager;
  const userFilter = team ? {} : { userId: currentUserId };
  const base = { task: { project: { organizationId } }, isRunning: false, ...userFilter };
  const now = new Date();

  const [today, week, month, selected, byProjectRows, byUserRows, byTaskRows, dailyRows] =
    await Promise.all([
      sum(base, startOfDay(now)),
      sum(base, startOfWeek(now, { weekStartsOn: 1 })),
      sum(base, startOfMonth(now)),
      (async () => {
        const b = rangeBounds(range);
        const r = await prisma.timeEntry.aggregate({
          where: { ...base, startedAt: { gte: b.from, lte: b.to } },
          _sum: { durationSec: true },
        });
        return r._sum.durationSec ?? 0;
      })(),
      prisma.timeEntry.findMany({
        where: { ...base, startedAt: { gte: rangeBounds(range).from, lte: rangeBounds(range).to } },
        select: {
          durationSec: true,
          task: { select: { project: { select: { id: true, name: true, color: true } } } },
        },
      }),
      team
        ? prisma.timeEntry.findMany({
            where: { ...base, startedAt: { gte: rangeBounds(range).from, lte: rangeBounds(range).to } },
            select: { durationSec: true, user: { select: { id: true, name: true, image: true } } },
          })
        : Promise.resolve([]),
      prisma.timeEntry.findMany({
        where: { ...base, startedAt: { gte: rangeBounds(range).from, lte: rangeBounds(range).to } },
        select: {
          durationSec: true,
          task: { select: { id: true, number: true, title: true, project: { select: { key: true } } } },
        },
      }),
      prisma.timeEntry.findMany({
        where: { ...base, startedAt: { gte: subDays(startOfDay(now), 13) } },
        select: { durationSec: true, startedAt: true },
      }),
    ]);

  const byProject = aggregate(
    byProjectRows,
    (r) => r.task.project.id,
    (r) => ({ name: r.task.project.name, color: r.task.project.color }),
  );
  const byUser = aggregate(
    byUserRows,
    (r) => r.user.id,
    (r) => ({ name: r.user.name ?? "—", image: r.user.image }),
  );
  const byTask = aggregate(
    byTaskRows,
    (r) => r.task.id,
    (r) => ({ name: `${r.task.project.key}-${r.task.number} ${r.task.title}` }),
  ).slice(0, 8);

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = subDays(startOfDay(now), 13 - i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of dailyRows) {
    const key = r.startedAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + r.durationSec);
  }

  return {
    totals: { todaySec: today, weekSec: week, monthSec: month, rangeSec: selected },
    byProject,
    byUser,
    byTask,
    daily: [...dailyMap.entries()].map(([date, sec]) => ({ date, hours: +(sec / 3600).toFixed(2) })),
  };
}

async function sum(base: object, since: Date): Promise<number> {
  const r = await prisma.timeEntry.aggregate({
    where: { ...base, startedAt: { gte: since } },
    _sum: { durationSec: true },
  });
  return r._sum.durationSec ?? 0;
}

function aggregate<T>(
  rows: (T & { durationSec: number })[],
  keyOf: (r: T) => string,
  metaOf: (r: T) => Record<string, unknown>,
) {
  const map = new Map<string, { seconds: number; meta: Record<string, unknown> }>();
  for (const r of rows) {
    const k = keyOf(r);
    const cur = map.get(k) ?? { seconds: 0, meta: metaOf(r) };
    cur.seconds += r.durationSec;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([id, v]) => ({ id, seconds: v.seconds, ...v.meta }))
    .sort((a, b) => b.seconds - a.seconds);
}
