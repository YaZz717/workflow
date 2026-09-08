import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { handleRoute, ok } from "@/lib/http";
import { getActiveOrganization } from "@/server/organizations";
import { requireOrgMember } from "@/server/context";
import { orgRoleAtLeast } from "@/lib/permissions";

const querySchema = z.object({ q: z.string().min(2).max(100) });

/** Extrait un court extrait de texte autour de la 1re occurrence de `term`. */
function snippet(text: string, term: string): string {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return text.slice(0, 80);
  const start = Math.max(0, i - 30);
  return (start > 0 ? "…" : "") + text.slice(start, start + 90).replace(/\s+/g, " ") + "…";
}

/**
 * GET /api/search?q=...
 * Recherche globale limitée à l'organisation active de l'utilisateur.
 * Toutes les requêtes sont filtrées par organizationId : impossible de voir
 * les données d'une autre organisation. Les projets/tâches/documents/commentaires
 * sont en plus bornés aux projets visibles par l'utilisateur.
 */
export const GET = handleRoute(async (req: NextRequest) => {
  const { q } = querySchema.parse({ q: req.nextUrl.searchParams.get("q") });
  const org = await getActiveOrganization();
  const ctx = await requireOrgMember(org.id);
  const isManager = orgRoleAtLeast(ctx.role, "MANAGER");

  const like = { contains: q, mode: "insensitive" as const };
  const visibleProjects = await prisma.project.findMany({
    where: { organizationId: org.id, ...(isManager ? {} : { members: { some: { userId: ctx.user.id } } }) },
    select: { id: true },
  });
  const projectIds = visibleProjects.map((p) => p.id);

  const [projects, tasks, documents, comments, members] = await Promise.all([
    prisma.project.findMany({
      where: { id: { in: projectIds }, OR: [{ name: like }, { key: like }] },
      select: { id: true, name: true, key: true },
      take: 5,
    }),
    prisma.task.findMany({
      where: { projectId: { in: projectIds }, OR: [{ title: like }, { description: like }] },
      select: {
        id: true,
        title: true,
        number: true,
        project: { select: { id: true, key: true } },
      },
      take: 6,
    }),
    prisma.document.findMany({
      where: {
        organizationId: org.id,
        isArchived: false,
        OR: [{ projectId: null }, { projectId: { in: projectIds } }],
        AND: [{ OR: [{ title: like }, { content: like }] }],
      },
      select: { id: true, title: true, content: true },
      take: 6,
    }),
    prisma.comment.findMany({
      where: { body: like, task: { projectId: { in: projectIds } } },
      select: {
        id: true,
        body: true,
        task: { select: { id: true, number: true, project: { select: { id: true, key: true } } } },
      },
      take: 5,
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: org.id, user: { OR: [{ name: like }, { email: like }] } },
      select: { user: { select: { id: true, name: true, email: true } } },
      take: 5,
    }),
  ]);

  const results = [
    ...projects.map((p) => ({
      type: "project" as const,
      id: p.id,
      title: p.name,
      subtitle: p.key,
      href: `/projects/${p.id}`,
    })),
    ...tasks.map((t) => ({
      type: "task" as const,
      id: t.id,
      title: t.title,
      subtitle: `${t.project.key}-${t.number}`,
      href: `/projects/${t.project.id}/tasks/${t.id}`,
    })),
    ...documents.map((d) => ({
      type: "document" as const,
      id: d.id,
      title: d.title,
      subtitle: d.content ? snippet(d.content, q) : undefined,
      href: `/documents/${d.id}`,
    })),
    ...comments.map((c) => ({
      type: "comment" as const,
      id: c.id,
      title: snippet(c.body, q),
      subtitle: `${c.task.project.key}-${c.task.number}`,
      href: `/projects/${c.task.project.id}/tasks/${c.task.id}`,
    })),
    ...members.map((m) => ({
      type: "member" as const,
      id: m.user.id,
      title: m.user.name ?? m.user.email,
      subtitle: m.user.email,
      href: `/team/${m.user.id}`,
    })),
  ];

  return ok({ results });
});
