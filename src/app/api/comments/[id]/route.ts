import { handleRoute, ok, noContent } from "@/lib/http";
import { requireUser } from "@/server/context";
import { updateComment, deleteComment } from "@/server/task-mutations";
import { updateCommentSchema } from "@/lib/validations/task";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const { body } = updateCommentSchema.parse(await req.json());
  const comment = await updateComment({ id: user.id, name: user.name }, id, body);
  return ok({ comment });
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteComment({ id: user.id, name: user.name }, id);
  return noContent();
});
