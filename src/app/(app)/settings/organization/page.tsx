import { prisma } from "@/lib/prisma";
import { getActiveOrganization } from "@/server/organizations";
import { requireOrgMember } from "@/server/context";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportMenu } from "@/components/shared/export-menu";
import { ORG_ROLE_LABEL } from "@/lib/constants";

export default async function OrganizationSettingsPage() {
  const active = await getActiveOrganization();
  const ctx = await requireOrgMember(active.id);
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: active.id },
    include: {
      settings: true,
      subscription: true,
      _count: { select: { members: true, projects: true } },
    },
  });

  const editable = can(ctx.role, "org.update");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Nom" value={org.name} />
          <Row label="Identifiant" value={org.slug} />
          <Row label="Description" value={org.description ?? "—"} />
          <Row label="Votre rôle" value={ORG_ROLE_LABEL[ctx.role]} />
          <Row label="Membres" value={String(org._count.members)} />
          <Row label="Projets" value={String(org._count.projects)} />
          {!editable ? (
            <p className="pt-2 text-xs text-muted-foreground">
              Seuls les administrateurs peuvent modifier ces informations (édition livrée en Phase 2).
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge>{org.subscription?.plan ?? "FREE"}</Badge>
            <Badge variant="success">{org.subscription?.status ?? "TRIALING"}</Badge>
          </div>
          <Row label="Sièges" value={String(org.subscription?.seats ?? 0)} />
          <Row
            label="Renouvellement"
            value={
              org.subscription?.currentPeriodEnd
                ? org.subscription.currentPeriodEnd.toLocaleDateString("fr-FR")
                : "—"
            }
          />
          <p className="pt-2 text-xs text-muted-foreground">Abonnement fictif — aucune facturation réelle.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export des données</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Téléchargez les projets, tâches et entrées de temps au format CSV.
          </p>
          <ExportMenu />
        </CardContent>
      </Card>
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
