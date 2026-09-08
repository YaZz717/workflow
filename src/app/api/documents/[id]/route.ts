import { handleRoute, ok, noContent, Errors } from "@/lib/http";
import { requireUser, requireDocumentAccess } from "@/server/context";
import { getDocument, updateDocument, deleteDocument } from "@/server/documents";
import { updateDocumentSchema } from "@/lib/validations/document";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await requireDocumentAccess(id);
  const doc = await getDocument(id);
  if (!doc) throw Errors.notFound();
  return ok({ document: doc });
});

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const input = updateDocumentSchema.parse(await req.json());
  await updateDocument({ id: user.id, name: user.name }, id, {
    title: input.title,
    content: input.content,
    folderId: input.folderId === undefined ? undefined : input.folderId,
    isArchived: input.isArchived,
  });
  const doc = await getDocument(id);
  return ok({ document: doc });
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteDocument({ id: user.id, name: user.name }, id);
  return noContent();
});
