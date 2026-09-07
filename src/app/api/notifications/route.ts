import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleRoute, ok, readPagination, paginated } from "@/lib/http";
import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";

/**
 * GET /api/notifications
 *  - ?unread=preview  -> 8 dernières + compteur non lues (pour la cloche)
 *  - sinon            -> liste paginée
 */
export const GET = handleRoute(async (req: NextRequest) => {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const scope = { recipientId: user.id, organizationId: org.id };

  if (req.nextUrl.searchParams.get("unread") === "preview") {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: scope,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.notification.count({ where: { ...scope, readAt: null } }),
    ]);
    return ok({ items, unread });
  }

  const { page, pageSize, skip, take } = readPagination(req.nextUrl);
  const filter = req.nextUrl.searchParams.get("filter");
  const where = filter === "unread" ? { ...scope, readAt: null } : scope;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { actor: { select: { id: true, name: true, image: true } } },
    }),
    prisma.notification.count({ where }),
  ]);

  return ok(paginated(items, total, page, pageSize));
});

/** PATCH /api/notifications  -> marque tout comme lu */
export const PATCH = handleRoute(async () => {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const res = await prisma.notification.updateMany({
    where: { recipientId: user.id, organizationId: org.id, readAt: null },
    data: { readAt: new Date() },
  });
  return ok({ updated: res.count });
});
