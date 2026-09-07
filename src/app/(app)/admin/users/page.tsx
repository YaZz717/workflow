import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { AdminUserRow } from "./user-row";
import type { PageParams } from "@/types/page";

export default async function AdminUsersPage({ searchParams }: PageParams) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";

  const users = await prisma.user.findMany({
    where: search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { memberships: true } } },
  });

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Rechercher par nom ou email…"
          className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
        />
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Orgs</th>
                <th className="px-4 py-3 font-medium">Rôle plateforme</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={u.name} image={u.image} />
                      <div>
                        <p className="font-medium">{u.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="destructive">Désactivé</Badge>
                    )}
                    {!u.emailVerified ? <Badge variant="warning" className="ml-1">Non vérifié</Badge> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u._count.memberships}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.globalRole === "ADMIN" ? "default" : "muted"}>{u.globalRole}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <AdminUserRow
                      userId={u.id}
                      globalRole={u.globalRole}
                      isActive={u.isActive}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
