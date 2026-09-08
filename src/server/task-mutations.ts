import type { Prisma, TaskStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/http";
import { requireProjectAccess, requireTaskAccess } from "@/server/context";
import { orgRoleAtLeast } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { computeBoardOrder } from "@/lib/board-order";
import { extractMentions } from "@/lib/mentions";
import { TASK_STATUS, PRIORITY } from "@/lib/constants";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "@/lib/validations/task";

type Actor = { id: string; name: string | null };

function canEdit(projectRole: string): boolean {
  return projectRole !== "VIEWER";
}

function taskRef(projectKey: string, number: number) {
  return `${projectKey}-${number}`;
}

async function activity(
  tx: Prisma.TransactionClient,
  taskId: string,
  actorId: string,
  field: string,
  oldValue: string | null,
  newValue: string | null,
) {
  await tx.taskActivity.create({ data: { taskId, actorId, field, oldValue, newValue } });
}

// ---------------------------------------------------------------------------

export async function createTask(actor: Actor, projectId: string, input: CreateTaskInput) {
  const { project, projectRole } = await requireProjectAccess(projectId);
  if (!canEdit(projectRole)) throw Errors.forbidden("Vous ne pouvez pas créer de tâche ici.");

  // Valider assignés & tags dans le périmètre du projet / de l'org.
  const [validAssignees, validTags] = await Promise.all([
    input.assigneeIds.length
      ? prisma.projectMember.findMany({
          where: { projectId, userId: { in: input.assigneeIds } },
          select: { userId: true },
        })
      : [],
    input.tagIds.length
      ? prisma.tag.findMany({
          where: { organizationId: project.organizationId, id: { in: input.tagIds } },
          select: { id: true },
        })
      : [],
  ]);

  const task = await prisma.$transaction(async (tx) => {
    // `next` = numéro à attribuer à la prochaine tâche. Après upsert, le numéro
    // de la tâche courante est toujours `counter.next - 1` (create → 2-1=1).
    const counter = await tx.projectTaskCounter.upsert({
      where: { projectId },
      create: { projectId, next: 2 },
      update: { next: { increment: 1 } },
    });
    const number = counter.next - 1;

    // Position en haut de la colonne cible.
    const first = await tx.task.findFirst({
      where: { projectId, status: input.status },
      orderBy: { boardOrder: "asc" },
      select: { boardOrder: true },
    });

    const created = await tx.task.create({
      data: {
        projectId,
        number,
        title: input.title,
        description: input.description || null,
        status: input.status,
        priority: input.priority,
        boardOrder: computeBoardOrder(null, first?.boardOrder ?? null),
        dueDate: input.dueDate,
        estimateMinutes: input.estimateMinutes ?? null,
        startedAt: input.status !== "BACKLOG" && input.status !== "TODO" ? new Date() : null,
        completedAt: input.status === "DONE" ? new Date() : null,
        createdById: actor.id,
        assignees: { create: validAssignees.map((a) => ({ userId: a.userId })) },
        tags: { create: validTags.map((t) => ({ tagId: t.id })) },
      },
      select: { id: true, number: true, title: true },
    });

    await activity(tx, created.id, actor.id, "created", null, TASK_STATUS[input.status].label);
    return created;
  });

  await recordAudit({
    organizationId: project.organizationId,
    actorId: actor.id,
    action: "task.create",
    resourceType: "Task",
    resourceId: task.id,
    summary: `${actor.name} a créé la tâche ${taskRef(project.key, task.number)} « ${task.title} »`,
  });
  await notify({
    organizationId: project.organizationId,
    recipientIds: validAssignees.map((a) => a.userId),
    actorId: actor.id,
    type: "TASK_ASSIGNED",
    title: `Tâche assignée : ${task.title}`,
    body: `${project.name} · ${taskRef(project.key, task.number)}`,
    link: `/projects/${projectId}/tasks/${task.id}`,
    entityType: "Task",
    entityId: task.id,
  });

  return task;
}

// ---------------------------------------------------------------------------

export async function updateTask(actor: Actor, taskId: string, input: UpdateTaskInput) {
  const { task, project, projectRole } = await requireTaskAccess(taskId);
  if (!canEdit(projectRole)) throw Errors.forbidden();

  const current = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { assignees: true, tags: true },
  });

  const data: Prisma.TaskUpdateInput = {};
  const changes: { field: string; old: string | null; new: string | null }[] = [];

  if (input.title !== undefined && input.title !== current.title) {
    data.title = input.title;
    changes.push({ field: "titre", old: current.title, new: input.title });
  }
  if (input.description !== undefined) data.description = input.description || null;
  if (input.priority && input.priority !== current.priority) {
    data.priority = input.priority;
    changes.push({ field: "priorité", old: PRIORITY[current.priority].label, new: PRIORITY[input.priority].label });
  }
  if (input.estimateMinutes !== undefined) data.estimateMinutes = input.estimateMinutes ?? null;
  if (input.dueDate !== undefined) {
    const oldD = current.dueDate?.toISOString().slice(0, 10) ?? null;
    const newD = input.dueDate?.toISOString().slice(0, 10) ?? null;
    if (oldD !== newD) {
      data.dueDate = input.dueDate;
      changes.push({ field: "échéance", old: oldD, new: newD });
    }
  }

  let statusChanged = false;
  if (input.status && input.status !== current.status) {
    statusChanged = true;
    data.status = input.status;
    if (input.status === "DONE") data.completedAt = new Date();
    else if (current.status === "DONE") data.completedAt = null;
    if (!current.startedAt && input.status !== "BACKLOG" && input.status !== "TODO")
      data.startedAt = new Date();
    changes.push({
      field: "statut",
      old: TASK_STATUS[current.status].label,
      new: TASK_STATUS[input.status].label,
    });
  }

  // Assignés
  let newlyAssigned: string[] = [];
  if (input.assigneeIds) {
    const valid = await prisma.projectMember.findMany({
      where: { projectId: task.projectId, userId: { in: input.assigneeIds } },
      select: { userId: true },
    });
    const nextIds = new Set(valid.map((v) => v.userId));
    const prevIds = new Set(current.assignees.map((a) => a.userId));
    newlyAssigned = [...nextIds].filter((id) => !prevIds.has(id));
    const removed = [...prevIds].filter((id) => !nextIds.has(id));
    if (newlyAssigned.length || removed.length) {
      data.assignees = {
        deleteMany: removed.length ? { userId: { in: removed } } : undefined,
        create: newlyAssigned.map((userId) => ({ userId })),
      };
      changes.push({ field: "assignés", old: `${prevIds.size}`, new: `${nextIds.size}` });
    }
  }

  // Tags
  if (input.tagIds) {
    const valid = await prisma.tag.findMany({
      where: { organizationId: project.organizationId, id: { in: input.tagIds } },
      select: { id: true },
    });
    data.tags = { deleteMany: {}, create: valid.map((t) => ({ tagId: t.id })) };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.task.update({ where: { id: taskId }, data, select: { id: true, title: true } });
    for (const c of changes) await activity(tx, taskId, actor.id, c.field, c.old, c.new);
    return u;
  });

  if (changes.length) {
    await recordAudit({
      organizationId: project.organizationId,
      actorId: actor.id,
      action: "task.update",
      resourceType: "Task",
      resourceId: taskId,
      summary: `${actor.name} a modifié ${taskRef(project.key, task.number)} (${changes.map((c) => c.field).join(", ")})`,
    });
  }
  if (newlyAssigned.length) {
    await notify({
      organizationId: project.organizationId,
      recipientIds: newlyAssigned,
      actorId: actor.id,
      type: "TASK_ASSIGNED",
      title: `Tâche assignée : ${updated.title}`,
      body: `${project.name} · ${taskRef(project.key, task.number)}`,
      link: `/projects/${task.projectId}/tasks/${taskId}`,
      entityType: "Task",
      entityId: taskId,
    });
  }

  return { statusChanged };
}

// ---------------------------------------------------------------------------

export async function moveTask(
  actor: Actor,
  taskId: string,
  move: { status: TaskStatus; beforeId?: string | null; afterId?: string | null },
) {
  const { task, project, projectRole } = await requireTaskAccess(taskId);
  if (!canEdit(projectRole)) throw Errors.forbidden();

  const [before, after] = await Promise.all([
    move.beforeId
      ? prisma.task.findUnique({ where: { id: move.beforeId }, select: { boardOrder: true, projectId: true } })
      : null,
    move.afterId
      ? prisma.task.findUnique({ where: { id: move.afterId }, select: { boardOrder: true, projectId: true } })
      : null,
  ]);
  if ((before && before.projectId !== task.projectId) || (after && after.projectId !== task.projectId)) {
    throw Errors.badRequest("Voisins invalides");
  }

  const boardOrder = computeBoardOrder(before?.boardOrder ?? null, after?.boardOrder ?? null);
  const statusChanged = move.status !== task.status;

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        status: move.status,
        boardOrder,
        completedAt: move.status === "DONE" ? new Date() : task.status === "DONE" ? null : undefined,
        startedAt:
          move.status !== "BACKLOG" && move.status !== "TODO" ? new Date() : undefined,
      },
    });
    if (statusChanged) {
      await activity(
        tx,
        taskId,
        actor.id,
        "statut",
        TASK_STATUS[task.status].label,
        TASK_STATUS[move.status].label,
      );
    }
  });

  if (statusChanged) {
    await recordAudit({
      organizationId: project.organizationId,
      actorId: actor.id,
      action: "task.move",
      resourceType: "Task",
      resourceId: taskId,
      summary: `${actor.name} a déplacé ${taskRef(project.key, task.number)} vers ${TASK_STATUS[move.status].label}`,
    });
  }
  return { boardOrder, statusChanged };
}

// ---------------------------------------------------------------------------

export async function deleteTask(actor: Actor, taskId: string) {
  const { task, project, projectRole, orgRole } = await requireTaskAccess(taskId);
  const full = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    select: { createdById: true, title: true },
  });
  const allowed =
    full.createdById === actor.id ||
    projectRole === "LEAD" ||
    orgRoleAtLeast(orgRole, "MANAGER");
  if (!allowed) throw Errors.forbidden("Suppression réservée au créateur ou aux responsables.");

  await prisma.task.delete({ where: { id: taskId } });
  await recordAudit({
    organizationId: project.organizationId,
    actorId: actor.id,
    action: "task.delete",
    resourceType: "Task",
    resourceId: taskId,
    summary: `${actor.name} a supprimé ${taskRef(project.key, task.number)} « ${full.title} »`,
  });
}

// ---------------------------------------------------------------------------
// Sous-tâches
// ---------------------------------------------------------------------------

export async function addSubtask(actor: Actor, taskId: string, title: string) {
  const { projectRole } = await requireTaskAccess(taskId);
  if (!canEdit(projectRole)) throw Errors.forbidden();
  const last = await prisma.subtask.findFirst({
    where: { taskId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return prisma.subtask.create({
    data: { taskId, title, position: (last?.position ?? 0) + 1 },
  });
}

export async function updateSubtask(
  actor: Actor,
  subtaskId: string,
  patch: { title?: string; isDone?: boolean; position?: number },
) {
  const sub = await prisma.subtask.findUnique({ where: { id: subtaskId }, select: { taskId: true } });
  if (!sub) throw Errors.notFound();
  const { projectRole } = await requireTaskAccess(sub.taskId);
  if (!canEdit(projectRole)) throw Errors.forbidden();
  return prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      title: patch.title,
      isDone: patch.isDone,
      position: patch.position,
      completedAt: patch.isDone === true ? new Date() : patch.isDone === false ? null : undefined,
    },
  });
}

export async function deleteSubtask(actor: Actor, subtaskId: string) {
  const sub = await prisma.subtask.findUnique({ where: { id: subtaskId }, select: { taskId: true } });
  if (!sub) throw Errors.notFound();
  const { projectRole } = await requireTaskAccess(sub.taskId);
  if (!canEdit(projectRole)) throw Errors.forbidden();
  await prisma.subtask.delete({ where: { id: subtaskId } });
}

// ---------------------------------------------------------------------------
// Commentaires
// ---------------------------------------------------------------------------

export async function addComment(
  actor: Actor,
  taskId: string,
  input: { body: string; parentId?: string | null },
) {
  const { task, project, projectRole } = await requireTaskAccess(taskId);
  if (!canEdit(projectRole)) throw Errors.forbidden();

  const [members, taskFull, parent] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId: task.projectId },
      select: { user: { select: { id: true, name: true } } },
    }),
    prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      select: { assignees: { select: { userId: true } }, createdById: true },
    }),
    input.parentId
      ? prisma.comment.findUnique({ where: { id: input.parentId }, select: { authorId: true, taskId: true } })
      : null,
  ]);
  if (input.parentId && (!parent || parent.taskId !== taskId)) throw Errors.badRequest();

  const candidates = members.map((m) => m.user);
  const mentionIds = extractMentions(input.body, candidates).filter((id) =>
    candidates.some((c) => c.id === id),
  );

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: actor.id,
      body: input.body,
      parentId: input.parentId ?? null,
      mentions: { create: mentionIds.map((userId) => ({ userId })) },
    },
    include: { author: { select: { id: true, name: true, image: true } }, mentions: true },
  });

  const link = `/projects/${task.projectId}/tasks/${taskId}`;
  // Mentions
  await notify({
    organizationId: project.organizationId,
    recipientIds: mentionIds,
    actorId: actor.id,
    type: "MENTION",
    title: `${actor.name} vous a mentionné`,
    body: input.body.slice(0, 140),
    link,
    entityType: "Task",
    entityId: taskId,
  });
  // Réponse au parent
  if (parent?.authorId) {
    await notify({
      organizationId: project.organizationId,
      recipientIds: [parent.authorId],
      actorId: actor.id,
      type: "COMMENT_REPLY",
      title: `${actor.name} a répondu à votre commentaire`,
      body: input.body.slice(0, 140),
      link,
      entityType: "Task",
      entityId: taskId,
    });
  }
  // Assignés + créateur de la tâche (hors mentionnés déjà notifiés)
  const already = new Set([...mentionIds, parent?.authorId].filter(Boolean) as string[]);
  const watchers = [
    ...taskFull.assignees.map((a) => a.userId),
    taskFull.createdById,
  ].filter((id) => !already.has(id));
  await notify({
    organizationId: project.organizationId,
    recipientIds: watchers,
    actorId: actor.id,
    type: "TASK_COMMENTED",
    title: `Nouveau commentaire sur ${taskRef(project.key, task.number)}`,
    body: input.body.slice(0, 140),
    link,
    entityType: "Task",
    entityId: taskId,
  });

  return comment;
}

export async function updateComment(actor: Actor, commentId: string, body: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, taskId: true },
  });
  if (!comment) throw Errors.notFound();
  if (comment.authorId !== actor.id) throw Errors.forbidden("Vous ne pouvez modifier que vos commentaires.");
  await requireTaskAccess(comment.taskId);

  const members = await prisma.projectMember.findMany({
    where: { project: { tasks: { some: { id: comment.taskId } } } },
    select: { user: { select: { id: true, name: true } } },
  });
  const mentionIds = extractMentions(body, members.map((m) => m.user));

  return prisma.$transaction(async (tx) => {
    await tx.commentMention.deleteMany({ where: { commentId } });
    return tx.comment.update({
      where: { id: commentId },
      data: {
        body,
        editedAt: new Date(),
        mentions: { create: mentionIds.map((userId) => ({ userId })) },
      },
      include: { author: { select: { id: true, name: true, image: true } }, mentions: true },
    });
  });
}

export async function deleteComment(actor: Actor, commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, taskId: true },
  });
  if (!comment) throw Errors.notFound();
  const { projectRole, orgRole } = await requireTaskAccess(comment.taskId);
  const allowed =
    comment.authorId === actor.id || projectRole === "LEAD" || orgRoleAtLeast(orgRole, "MANAGER");
  if (!allowed) throw Errors.forbidden();
  await prisma.comment.delete({ where: { id: commentId } });
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function listOrgTags(organizationId: string) {
  return prisma.tag.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, _count: { select: { tasks: true } } },
  });
}

export async function createTag(
  actor: Actor,
  organizationId: string,
  input: { name: string; color: string },
) {
  const existing = await prisma.tag.findUnique({
    where: { organizationId_name: { organizationId, name: input.name } },
  });
  if (existing) return existing;
  return prisma.tag.create({ data: { organizationId, name: input.name, color: input.color } });
}
