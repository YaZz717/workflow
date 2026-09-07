import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/http";
import { requireProjectAccess } from "@/server/context";

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
  const durationSec = Math.max(
    0,
    Math.round((Date.now() - running.startedAt.getTime()) / 1000),
  );
  return prisma.timeEntry.update({
    where: { id: running.id },
    data: { isRunning: false, endedAt: new Date(), durationSec },
  });
}
