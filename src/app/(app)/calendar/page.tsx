import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendrier" };

export default async function CalendarPage() {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const isManager = orgRoleAtLeast(org.role, "MANAGER");

  const [projects, members] = await Promise.all([
    prisma.project.findMany({
      where: {
        organizationId: org.id,
        ...(isManager ? {} : { members: { some: { userId: user.id } } }),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      orderBy: { user: { name: "asc" } },
      select: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Calendrier"
        description="Échéances des tâches, réunions et événements de l'équipe."
      />
      <CalendarView projects={projects} members={members.map((m) => m.user)} />
    </div>
  );
}
