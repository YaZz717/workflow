import { notFound } from "next/navigation";

import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireTaskAccess } from "@/server/context";
import { getProjectAssignableUsers } from "@/server/tasks";
import { orgRoleAtLeast } from "@/lib/permissions";
import { TaskDetailView } from "@/components/tasks/task-detail/task-detail-view";
import type { PageParams } from "@/types/page";

export default async function TaskDetailPage({
  params,
}: PageParams<{ projectId: string; taskId: string }>) {
  const { projectId, taskId } = await params;

  let access;
  try {
    access = await requireTaskAccess(taskId);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }
  if (access.task.projectId !== projectId) notFound();

  const [members, taskOwner] = await Promise.all([
    getProjectAssignableUsers(projectId),
    prisma.task.findUnique({ where: { id: taskId }, select: { createdById: true } }),
  ]);

  const canEdit = access.projectRole !== "VIEWER";
  const canManageTags = orgRoleAtLeast(access.orgRole, "MANAGER");
  const canModerate = access.projectRole === "LEAD" || orgRoleAtLeast(access.orgRole, "MANAGER");
  const canDelete =
    taskOwner?.createdById === access.user.id ||
    access.projectRole === "LEAD" ||
    orgRoleAtLeast(access.orgRole, "MANAGER");

  return (
    <TaskDetailView
      taskId={taskId}
      projectId={projectId}
      members={members}
      currentUserId={access.user.id}
      canEdit={canEdit}
      canManageTags={canManageTags}
      canModerate={canModerate}
      canDelete={canDelete}
    />
  );
}
