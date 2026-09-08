import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";

import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { listProjects } from "@/server/projects";
import { listOrgMembersForPicker } from "./actions";
import { can } from "@/lib/permissions";
import { projectListQuerySchema } from "@/lib/validations/project";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/misc";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import type { PageParams } from "@/types/page";

export const metadata: Metadata = { title: "Projets" };

export default async function ProjectsPage({ searchParams }: PageParams) {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const sp = await searchParams;

  const filters = projectListQuerySchema.parse({
    q: typeof sp.q === "string" ? sp.q : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    priority: typeof sp.priority === "string" ? sp.priority : undefined,
    sort: typeof sp.sort === "string" ? sp.sort : undefined,
  });

  const [projects, members] = await Promise.all([
    listProjects(org.id, user.id, org.role, filters),
    can(org.role, "project.create") ? listOrgMembersForPicker() : Promise.resolve([]),
  ]);

  const canCreate = can(org.role, "project.create");

  return (
    <div className="space-y-5">
      <PageHeader title="Projets" description={`${projects.length} projet(s) dans ${org.name}`}>
        {canCreate ? <ProjectFormDialog mode="create" members={members} /> : null}
      </PageHeader>

      <ProjectFilters />

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title="Aucun projet"
          description={
            canCreate
              ? "Créez votre premier projet pour organiser les tâches de votre équipe."
              : "Aucun projet ne vous a encore été partagé."
          }
          action={canCreate ? <ProjectFormDialog mode="create" members={members} /> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
