import { handleRoute, ok, noContent } from "@/lib/http";
import { requireUser } from "@/server/context";
import { renameFolder, deleteFolder } from "@/server/documents";
import { updateFolderSchema } from "@/lib/validations/document";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const input = updateFolderSchema.parse(await req.json());
  const folder = input.name
    ? await renameFolder({ id: user.id, name: user.name }, id, input.name)
    : null;
  return ok({ folder });
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteFolder({ id: user.id, name: user.name }, id);
  return noContent();
});
