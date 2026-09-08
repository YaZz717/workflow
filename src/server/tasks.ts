import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PRIORITY } from "@/lib/constants";

/** Sélection commune pour l'affichage d'une carte de tâche. */
const taskCardSelect = {
  id: true,
  number: true,
  title: true,
  status: true,
  priority: true,
  boardOrder: true,
  dueDate: true,
  estimateMinutes: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, key: true, name: true, color: true } },
  assignees: { select: { user: { select: { id: true, name: true, image: true } } } },
  tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
  _count: { select: { comments: true, subtasks: true, attachments: true } },
  subtasks: { where: { isDone: true }, select: { id: true } },
} satisfies Prisma.TaskSelect;

export type TaskCard = Prisma.TaskGetPayload<{ select: typeof taskCardSelect }>;

function serializeCard(t: TaskCard) {
  return {
    id: t.id,
    number: t.number,
    title: t.title,
    status: t.status,
    priority: t.priority,
    boardOrder: t.boardOrder,
    dueDate: t.dueDate?.toISOString() ?? null,
    estimateMinutes: t.estimateMinutes,
    project: t.project,
    assignees: t.assignees.map((a) => a.user),
    tags: t.tags.map((x) => x.tag),
    commentCount: t._count.comments,
    attachmentCount: t._count.attachments,
    subtaskTotal: t._count.subtasks,
    subtaskDone: t.subtasks.length,
  };
}
export type SerializedTaskCard = ReturnType<typeof serializeCard>;

/** Toutes les tâches d'un projet (pour le board Kanban). */
export async function getProjectBoard(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: [{ boardOrder: "asc" }, { createdAt: "asc" }],
    select: taskCardSelect,
  });
  return tasks.map(serializeCard);
}

type ListFilters = {
  q?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  tagId?: string;
  sort?: "created" | "due" | "priority" | "updated";
  page?: number;
};

const PAGE_SIZE = 25;

function buildTaskWhere(base: Prisma.TaskWhereInput, f: ListFilters): Prisma.TaskWhereInput {
  return {
    ...base,
    ...(f.status ? { status: f.status as never } : {}),
    ...(f.priority ? { priority: f.priority as never } : {}),
    ...(f.assigneeId ? { assignees: { some: { userId: f.assigneeId } } } : {}),
    ...(f.tagId ? { tags: { some: { tagId: f.tagId } } } : {}),
    ...(f.q
      ? { OR: [{ title: { contains: f.q, mode: "insensitive" } }, { description: { contains: f.q, mode: "insensitive" } }] }
      : {}),
  };
}

function taskOrderBy(sort?: string): Prisma.TaskOrderByWithRelationInput[] {
  switch (sort) {
    case "due":
      return [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];
    case "updated":
      return [{ updatedAt: "desc" }];
    case "priority":
      return [{ createdAt: "desc" }]; // tri priorité fait côté serveur ci-dessous
    default:
      return [{ createdAt: "desc" }];
  }
}

async function paginateTasks(where: Prisma.TaskWhereInput, f: ListFilters) {
  const page = Math.max(1, f.page ?? 1);
  const [rows, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: taskOrderBy(f.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: taskCardSelect,
    }),
    prisma.task.count({ where }),
  ]);
  let items = rows.map(serializeCard);
  if (f.sort === "priority") {
    items = items.sort((a, b) => PRIORITY[b.priority].rank - PRIORITY[a.priority].rank);
  }
  return {
    items,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
  };
}

/** Liste paginée des tâches d'un projet (vue liste). */
export function getProjectTaskList(projectId: string, filters: ListFilters) {
  return paginateTasks(buildTaskWhere({ projectId }, filters), filters);
}

/** "Mes tâches" — toutes organisations confondues n'est pas voulu : on scope à l'org. */
export function getMyTasks(
  organizationId: string,
  userId: string,
  opts: ListFilters & { scope?: "assigned" | "created" | "all"; projectId?: string; overdue?: boolean },
) {
  const base: Prisma.TaskWhereInput = { project: { organizationId } };
  if (opts.projectId) base.projectId = opts.projectId;
  if (opts.scope === "created") base.createdById = userId;
  else if (opts.scope === "all")
    base.OR = [{ assignees: { some: { userId } } }, { createdById: userId }];
  else base.assignees = { some: { userId } };
  if (opts.overdue) {
    base.dueDate = { lt: new Date() };
    base.status = { not: "DONE" };
  }
  return paginateTasks(buildTaskWhere(base, opts), opts);
}

const taskDetailSelect = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  estimateMinutes: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, key: true, name: true } },
  createdBy: { select: { id: true, name: true, image: true } },
  assignees: { select: { user: { select: { id: true, name: true, image: true, email: true } } } },
  tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
  subtasks: { orderBy: { position: "asc" } },
  attachments: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      uploadedBy: { select: { name: true } },
    },
  },
  timeEntries: { select: { durationSec: true, userId: true } },
  activities: {
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, field: true, oldValue: true, newValue: true, createdAt: true },
  },
} satisfies Prisma.TaskSelect;

export async function getTaskDetail(taskId: string) {
  return prisma.task.findUnique({ where: { id: taskId }, select: taskDetailSelect });
}

export async function getTaskComments(taskId: string) {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
      mentions: { select: { userId: true } },
    },
  });
  return comments;
}

/** Membres pouvant être assignés / mentionnés sur une tâche = membres du projet. */
export async function getProjectAssignableUsers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { user: { select: { id: true, name: true, image: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return members.map((m) => m.user);
}
