import { notFound } from "next/navigation";

import { ApiError } from "@/lib/http";
import { requireProjectAccess } from "@/server/context";
import { getProjectAssignableUsers } from "@/server/tasks";
import { orgRoleAtLeast } from "@/lib/permissions";
import { ProjectTasksView } from "@/components/tasks/project-tasks-view";
import type { PageParams } from "@/types/page";

export default async function ProjectTasksPage({ params }: PageParams<{ projectId: string }>) {
  const { projectId } = await params;

  let access;
  try {
    access = await requireProjectAccess(projectId);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }

  const members = await getProjectAssignableUsers(projectId);
  const canEdit = access.projectRole !== "VIEWER";
  const canManageTags = orgRoleAtLeast(access.orgRole, "MANAGER");

  return (
    <ProjectTasksView
      projectId={projectId}
      members={members}
      canEdit={canEdit}
      canManageTags={canManageTags}
    />
  );
}
