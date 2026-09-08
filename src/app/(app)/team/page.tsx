import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { prisma } from "@/lib/prisma";
import { getActiveOrganization } from "@/server/organizations";
import { requireOrgMember } from "@/server/context";
import { can, ORG_ROLE_RANK } from "@/lib/permissions";
import { ORG_ROLE_LABEL } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { MemberRowActions } from "@/components/team/member-row-actions";
import { RevokeInvitationButton } from "@/components/team/revoke-invitation-button";

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage() {
  const org = await getActiveOrganization();
  const ctx = await requireOrgMember(org.id);

  const [members, invitations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, email: true, image: true, lastLoginAt: true } },
      },
    }),
    prisma.invitation.findMany({
      where: { organizationId: org.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { invitedBy: { select: { name: true } } },
    }),
  ]);

  const canInvite = can(ctx.role, "member.invite");
  const canChangeRole = can(ctx.role, "member.role.update");
  const canRemove = can(ctx.role, "member.remove");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        description={`${members.length} membre(s) dans ${org.name}`}
      >
        {canInvite ? <InviteMemberDialog canInviteAdmin={ctx.role === "OWNER"} /> : null}
      </PageHeader>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Membre</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Dernière connexion</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isSelf = m.userId === ctx.user.id;
                const lowerRank = ORG_ROLE_RANK[m.role] < ORG_ROLE_RANK[ctx.role];
                return (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={m.user.name} image={m.user.image} />
                        <div>
                          <p className="font-medium">
                            {m.user.name} {isSelf ? <span className="text-xs text-muted-foreground">(vous)</span> : null}
                          </p>
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
                        ? formatDistanceToNow(m.user.lastLoginAt, { addSuffix: true, locale: fr })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSelf && m.role !== "OWNER" ? (
                        <MemberRowActions
                          userId={m.userId}
                          userName={m.user.name ?? m.user.email}
                          currentRole={m.role}
                          canChangeRole={canChangeRole}
                          canRemove={canRemove && lowerRank}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold">
          Invitations en attente ({invitations.length})
        </h2>
        {invitations.length === 0 ? (
          <EmptyState title="Aucune invitation en attente" />
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium">{inv.email}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      invité par {inv.invitedBy.name} ·{" "}
                      {formatDistanceToNow(inv.createdAt, { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{ORG_ROLE_LABEL[inv.role]}</Badge>
                    {canInvite ? <RevokeInvitationButton invitationId={inv.id} /> : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
