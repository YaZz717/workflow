import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { TimeDashboard } from "@/components/time/time-dashboard";

export const metadata: Metadata = { title: "Suivi du temps" };

export default async function TimePage() {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const isManager = orgRoleAtLeast(org.role, "MANAGER");

  const projects = await prisma.project.findMany({
    where: {
      organizationId: org.id,
      ...(isManager ? {} : { members: { some: { userId: user.id } } }),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      key: true,
      tasks: {
        where: { status: { not: "DONE" } },
        orderBy: { number: "asc" },
        select: { id: true, number: true, title: true },
      },
    },
  });

  const taskOptions = projects.flatMap((p) =>
    p.tasks.map((t) => ({ id: t.id, label: `${p.key}-${t.number} · ${t.title}` })),
  );

  return (
    <div>
      <PageHeader
        title="Suivi du temps"
        description="Chronomètre, saisie manuelle et statistiques."
      />
      <TimeDashboard
        isManager={isManager}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        taskOptions={taskOptions}
      />
    </div>
  );
}
