import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminOrganizationsPage() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: { select: { members: true, projects: true } },
      members: {
        where: { role: "OWNER" },
        take: 1,
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Organisation</th>
              <th className="px-4 py-3 font-medium">Propriétaire</th>
              <th className="px-4 py-3 font-medium">Membres</th>
              <th className="px-4 py-3 font-medium">Projets</th>
              <th className="px-4 py-3 font-medium">Plan</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{o.name}</p>
                  <p className="text-xs text-muted-foreground">/{o.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.members[0]?.user.name ?? o.members[0]?.user.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o._count.members}</td>
                <td className="px-4 py-3 text-muted-foreground">{o._count.projects}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{o.subscription?.plan ?? "FREE"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
