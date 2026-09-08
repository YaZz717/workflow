import { notFound } from "next/navigation";
import { format } from "date-fns";

import { ApiError } from "@/lib/http";
import { requireProjectAccess } from "@/server/context";
import { listOrgMembersForPicker } from "@/app/(app)/projects/actions";
import { orgRoleAtLeast, projectRoleAtLeast } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { Button } from "@/components/ui/button";
import type { PageParams } from "@/types/page";

export default async function ProjectSettingsPage({
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
  const canDelete = orgRoleAtLeast(access.orgRole, "MANAGER");
  const { project } = access;
  const members = canManage ? await listOrgMembersForPicker() : [];

  if (!canManage) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Seuls le responsable du projet et les managers de l&apos;organisation peuvent modifier ces
          paramètres.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Informations du projet</CardTitle>
          <ProjectFormDialog
            mode="edit"
            projectId={projectId}
            members={members}
            trigger={<Button variant="outline" size="sm">Modifier</Button>}
            defaults={{
              name: project.name,
              description: project.description,
              color: project.color,
              priority: project.priority,
              status: project.status,
              startDate: project.startDate ? format(project.startDate, "yyyy-MM-dd") : undefined,
              endDate: project.endDate ? format(project.endDate, "yyyy-MM-dd") : undefined,
              leadId: project.leadId,
            }}
          />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Nom" value={project.name} />
          <Row label="Clé" value={project.key} />
          <Row label="Statut" value={project.status} />
          <Row label="Priorité" value={project.priority} />
          <Row label="Description" value={project.description ?? "—"} />
        </CardContent>
      </Card>

      {canDelete ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              La suppression du projet efface toutes ses tâches, documents et fichiers.
            </p>
            <DeleteProjectButton projectId={projectId} projectName={project.name} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
