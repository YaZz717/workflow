import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { handleRoute, ok } from "@/lib/http";
import { getActiveOrganization } from "@/server/organizations";
import { requireOrgMember } from "@/server/context";

const querySchema = z.object({ q: z.string().min(2).max(100) });

/**
 * GET /api/search?q=...
 * Recherche globale limitée à l'organisation active de l'utilisateur.
 * Toutes les requêtes sont filtrées par organizationId : impossible de voir
 * les données d'une autre organisation.
 */
export const GET = handleRoute(async (req: NextRequest) => {
  const { q } = querySchema.parse({ q: req.nextUrl.searchParams.get("q") });
  const org = await getActiveOrganization();
  await requireOrgMember(org.id);

  const like = { contains: q, mode: "insensitive" as const };

  const [projects, tasks, documents, members] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: org.id, name: like },
      select: { id: true, name: true, key: true, status: true },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        project: { organizationId: org.id },
        OR: [{ title: like }, { description: like }],
      },
      select: {
        id: true,
        title: true,
        number: true,
        project: { select: { id: true, key: true } },
      },
      take: 6,
    }),
    prisma.document.findMany({
      where: { organizationId: org.id, title: like, isArchived: false },
      select: { id: true, title: true, projectId: true },
      take: 5,
    }),
    prisma.organizationMember.findMany({
      where: {
        organizationId: org.id,
        user: { OR: [{ name: like }, { email: like }] },
      },
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
      href: `/documents/${d.id}`,
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
