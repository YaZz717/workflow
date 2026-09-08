import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { MyTasksView } from "@/components/tasks/my-tasks-view";
import type { PageParams } from "@/types/page";

export const metadata: Metadata = { title: "Mes tâches" };

export default async function TasksPage({ searchParams }: PageParams) {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const sp = await searchParams;

  const isManager = orgRoleAtLeast(org.role, "MANAGER");
  const projects = await prisma.project.findMany({
    where: {
      organizationId: org.id,
      ...(isManager ? {} : { members: { some: { userId: user.id } } }),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, key: true },
  });

  return (
    <div>
      <PageHeader title="Mes tâches" description="Vos tâches sur l'ensemble des projets." />
      <MyTasksView
        projects={projects}
        initialScope={typeof sp.scope === "string" ? sp.scope : undefined}
        initialOverdue={sp.filter === "overdue"}
      />
    </div>
  );
}
