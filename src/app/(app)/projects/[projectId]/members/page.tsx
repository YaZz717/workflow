import { notFound } from "next/navigation";

import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/server/context";
import { orgRoleAtLeast, projectRoleAtLeast } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectMembersManager } from "@/components/projects/project-members-manager";
import type { PageParams } from "@/types/page";

export default async function ProjectMembersPage({
  params,
}: PageParams<{ projectId: string }>) {
  const { projectId } = await params;

  let access;
  try {
    access = await requireProjectAccess(projectId);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }

  const canManage =
    orgRoleAtLeast(access.orgRole, "MANAGER") || projectRoleAtLeast(access.projectRole, "LEAD");

  const [members, orgMembers] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { addedAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: access.project.organizationId },
      select: { user: { select: { id: true, name: true, email: true, image: true } } },
    }),
  ]);

  const inProject = new Set(members.map((m) => m.userId));
  const addable = orgMembers.map((m) => m.user).filter((u) => !inProject.has(u.id));

  return (
    <Card>
      <CardContent className="pt-6">
        <ProjectMembersManager
          projectId={projectId}
          leadId={access.project.leadId}
          canManage={canManage}
          members={members.map((m) => ({
            userId: m.userId,
            role: m.role,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
          }))}
          addable={addable}
        />
      </CardContent>
    </Card>
  );
}
