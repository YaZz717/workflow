import { NextResponse } from "next/server";

import { handleRoute, noContent, Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  requireUser,
  requireTaskAccess,
  requireDocumentAccess,
} from "@/server/context";
import { readUpload, removeUpload } from "@/lib/upload";
import { orgRoleAtLeast } from "@/lib/permissions";

type Ctx = { params: Promise<{ id: string }> };

/** Charge une pièce jointe et vérifie l'accès à sa ressource parente (tâche ou document). */
async function loadAccessible(attachmentId: string) {
  const att = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!att) throw Errors.notFound();

  if (att.taskId) {
    const access = await requireTaskAccess(att.taskId);
    return { att, orgRole: access.orgRole, projectRole: access.projectRole as string | null };
  }
  if (att.documentId) {
    const access = await requireDocumentAccess(att.documentId);
    return { att, orgRole: access.orgRole, projectRole: access.projectRole as string | null };
  }
  throw Errors.notFound();
}

/** GET /api/attachments/:id — télécharge le fichier (inline). */
export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { att } = await loadAccessible(id);
  const buffer = await readUpload(att.storageKey);
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": att.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(att.filename)}"`,
      "Content-Length": String(att.sizeBytes),
      "Cache-Control": "private, max-age=3600",
    },
  });
});

/** DELETE /api/attachments/:id */
export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const { att, orgRole, projectRole } = await loadAccessible(id);
  const allowed =
    att.uploadedById === user.id ||
    projectRole === "LEAD" ||
    orgRoleAtLeast(orgRole, "MANAGER");
  if (!allowed) throw Errors.forbidden();

  await prisma.attachment.delete({ where: { id } });
  await removeUpload(att.storageKey);
  return noContent();
});
