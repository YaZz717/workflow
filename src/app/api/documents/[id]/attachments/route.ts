import { handleRoute, created, Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser, requireDocumentAccess } from "@/server/context";
import { recordAudit } from "@/lib/audit";
import { storeUpload } from "@/lib/upload";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/documents/:id/attachments  (multipart, champ "file") */
export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const { doc, projectRole } = await requireDocumentAccess(id);
  if (projectRole === "VIEWER") throw Errors.forbidden();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw Errors.badRequest("Aucun fichier fourni");

  const meta = await storeUpload(`doc-${id}`, file);
  const attachment = await prisma.attachment.create({
    data: {
      documentId: id,
      uploadedById: user.id,
      filename: meta.filename,
      mimeType: meta.mimeType,
      sizeBytes: meta.sizeBytes,
      storageKey: meta.storageKey,
    },
    select: { id: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true },
  });

  await recordAudit({
    organizationId: doc.organizationId,
    actorId: user.id,
    action: "document.attachment_add",
    resourceType: "Document",
    resourceId: id,
    summary: `${user.name} a joint « ${meta.filename} » à « ${doc.title} »`,
  });

  return created({ attachment });
});
