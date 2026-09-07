import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { ORG_ROLE_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getActiveOrganization } from "@/server/organizations";
import { requireOrgMember } from "@/server/context";

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage() {
  const org = await getActiveOrganization();
  await requireOrgMember(org.id);

  const [members, invitations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      orderBy: { joinedAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true, image: true, lastLoginAt: true } } },
    }),
    prisma.invitation.findMany({
      where: { organizationId: org.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        description={`${members.length} membre${members.length > 1 ? "s" : ""} dans ${org.name}`}
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Membre</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Dernière connexion</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={m.user.name} image={m.user.image} />
                      <div>
                        <p className="font-medium">{m.user.name}</p>
                        <p className="text-xs text-muted-foreground">{m.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>
                      {ORG_ROLE_LABEL[m.role]}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {m.user.lastLoginAt
                      ? m.user.lastLoginAt.toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Invitations en attente</h2>
        {invitations.length === 0 ? (
          <EmptyState title="Aucune invitation en attente" description="La gestion des invitations arrive en Phase 2." />
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{inv.email}</span>
                  <Badge variant="warning">{ORG_ROLE_LABEL[inv.role]} · en attente</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
