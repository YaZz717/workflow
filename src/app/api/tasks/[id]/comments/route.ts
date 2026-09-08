import { handleRoute, ok, created } from "@/lib/http";
import { requireUser, requireTaskAccess } from "@/server/context";
import { getTaskComments } from "@/server/tasks";
import { addComment } from "@/server/task-mutations";
import { createCommentSchema } from "@/lib/validations/task";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await requireTaskAccess(id);
  return ok({ comments: await getTaskComments(id) });
});

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const input = createCommentSchema.parse(await req.json());
  const comment = await addComment(
    { id: user.id, name: user.name },
    id,
    { body: input.body, parentId: input.parentId },
  );
  return created({ comment });
});
