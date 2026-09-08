import { addDays, startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import { handleRoute, ok, Errors } from "@/lib/http";
import { env } from "@/env";
import { notify } from "@/lib/notifications";

/**
 * POST /api/cron/deadlines
 * À appeler quotidiennement par un planificateur externe :
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/deadlines
 *
 * Crée une notification TASK_DUE_SOON pour chaque tâche non terminée dont
 * l'échéance tombe dans les 48 h, sans doublon (une seule par tâche et par jour).
 */
export const POST = handleRoute(async (req: Request) => {
  if (!env.CRON_SECRET) throw Errors.badRequest("CRON_SECRET non configuré");
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) throw Errors.unauthorized();

  const now = new Date();
  const soon = addDays(now, 2);

  const tasks = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      dueDate: { gte: startOfDay(now), lte: soon },
    },
    select: {
      id: true,
      number: true,
      title: true,
      dueDate: true,
      project: { select: { id: true, key: true, name: true, organizationId: true } },
      assignees: { select: { userId: true } },
      createdById: true,
    },
  });

  let created = 0;
  for (const task of tasks) {
    const recipients = [
      ...task.assignees.map((a) => a.userId),
      task.createdById,
    ];
    const dayKey = task.dueDate!.toISOString().slice(0, 10);

    // Anti-doublon : pas de notif TASK_DUE_SOON pour cette tâche dans les 20 dernières heures.
    const recent = await prisma.notification.findFirst({
      where: {
        type: "TASK_DUE_SOON",
        entityId: task.id,
        createdAt: { gte: addDays(now, -1) },
      },
    });
    if (recent) continue;

    await notify({
      organizationId: task.project.organizationId,
      recipientIds: recipients,
      type: "TASK_DUE_SOON",
      title: `Échéance proche : ${task.title}`,
      body: `${task.project.key}-${task.number} · échéance le ${dayKey}`,
      link: `/projects/${task.project.id}/tasks/${task.id}`,
      entityType: "Task",
      entityId: task.id,
    });
    created += recipients.length;
  }

  return ok({ scanned: tasks.length, notificationsCreated: created });
});
