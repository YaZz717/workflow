import type { Priority, ProjectStatus } from "@prisma/client";
import { subDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import { orgRoleAtLeast } from "@/lib/permissions";
import { requireProjectAccess } from "@/server/context";
import { PRIORITY } from "@/lib/constants";

type ListFilters = {
  q?: string;
  status?: ProjectStatus;
  priority?: Priority;
  sort?: "recent" | "name" | "priority" | "endDate";
};

/**
 * Projets visibles par l'utilisateur dans l'organisation :
 * - tous si rôle org >= MANAGER
 * - sinon uniquement ceux dont il est membre
 */
export async function listProjects(
  organizationId: string,
  userId: string,
  orgRole: Parameters<typeof orgRoleAtLeast>[0],
  filters: ListFilters = {},
) {
  const isManager = orgRoleAtLeast(orgRole, "MANAGER");

  const where = {
    organizationId,
    ...(isManager ? {} : { members: { some: { userId } } }),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.q
      ? { OR: [{ name: { contains: filters.q, mode: "insensitive" as const } }, { key: { contains: filters.q, mode: "insensitive" as const } }] }
      : {}),
  };

  const orderBy =
    filters.sort === "name"
      ? { name: "asc" as const }
      : filters.sort === "endDate"
        ? { endDate: "asc" as const }
        : { updatedAt: "desc" as const };

  const projects = await prisma.project.findMany({
    where,
    orderBy,
    include: {
      lead: { select: { id: true, name: true, image: true } },
      members: {
        take: 5,
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { members: true, tasks: true } },
      tasks: { select: { status: true } },
    },
  });

  const mapped = projects.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "DONE").length;
    return {
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description,
      color: p.color,
      status: p.status,
      priority: p.priority,
      startDate: p.startDate,
      endDate: p.endDate,
      lead: p.lead,
      members: p.members.map((m) => m.user),
      memberCount: p._count.members,
      taskCount: total,
      doneCount: done,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });

  if (filters.sort === "priority") {
    mapped.sort((a, b) => PRIORITY[b.priority].rank - PRIORITY[a.priority].rank);
  }

  return mapped;
}

/** Détail d'un projet + statistiques, après contrôle d'accès. */
export async function getProjectOverview(projectId: string) {
  const { orgRole, projectRole, user } = await requireProjectAccess(projectId);

  const [full, tasksByStatus, overdue, recentActivity, upcoming] = await Promise.all([
    prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        lead: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        members: {
          orderBy: { addedAt: "asc" },
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        _count: { select: { tasks: true, documents: true } },
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: { projectId, status: { not: "DONE" }, dueDate: { lt: new Date() } },
    }),
    prisma.auditLog.findMany({
      where: { resourceType: "Project", resourceId: projectId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actor: { select: { name: true, image: true } } },
    }),
    prisma.task.findMany({
      where: { projectId, status: { not: "DONE" }, dueDate: { gte: subDays(new Date(), 0) } },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, number: true, dueDate: true, priority: true, status: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(tasksByStatus.map((r) => [r.status, r._count._all]));
  const total = full._count.tasks;
  const done = statusCounts["DONE"] ?? 0;

  return {
    project: full,
    access: { orgRole, projectRole, userId: user.id },
    stats: {
      taskCount: total,
      doneCount: done,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
      overdue,
      statusCounts,
      documentCount: full._count.documents,
    },
    recentActivity,
    upcoming,
  };
}
