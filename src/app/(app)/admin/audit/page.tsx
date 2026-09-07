import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { readPagination } from "@/lib/http";
import type { PageParams } from "@/types/page";

export default async function AdminAuditPage({ searchParams }: PageParams) {
  const sp = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") flat[k] = v;
  const url = new URL("http://x/?" + new URLSearchParams(flat).toString());
  const { page, pageSize, skip, take } = readPagination(url, 30);
  const action = typeof sp.action === "string" ? sp.action : undefined;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: action ? { action } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        actor: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
    }),
    prisma.auditLog.count({ where: action ? { action } : undefined }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} entrées · page {page}/{totalPages}
      </p>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Acteur</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Résumé</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {l.createdAt.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5">{l.actor?.name ?? l.actor?.email ?? "Système"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="muted" className="font-mono text-[11px]">{l.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {l.summary}
                    {l.organization ? (
                      <span className="text-muted-foreground"> · {l.organization.name}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <PageLink page={page - 1} disabled={page <= 1} label="← Précédent" action={action} />
        <PageLink page={page + 1} disabled={page >= totalPages} label="Suivant →" action={action} />
      </div>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  label,
  action,
}: {
  page: number;
  disabled: boolean;
  label: string;
  action?: string;
}) {
  if (disabled) return <span className="text-sm text-muted-foreground">{label}</span>;
  const qs = new URLSearchParams({ page: String(page), ...(action ? { action } : {}) });
  return (
    <a href={`/admin/audit?${qs}`} className="text-sm font-medium text-primary hover:underline">
      {label}
    </a>
  );
}
