import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { handleRoute, ok, Errors } from "@/lib/http";
import { requireUser } from "@/server/context";

const bodySchema = z.object({ read: z.boolean() });

/** PATCH /api/notifications/:id  -> marque une notification lue / non lue */
export const PATCH = handleRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { read } = bodySchema.parse(await req.json());

  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.recipientId !== user.id) throw Errors.notFound();

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: read ? new Date() : null },
  });
  return ok({ notification: updated });
});
