import { handleRoute, ok } from "@/lib/http";
import { requireUser } from "@/server/context";
import { moveTask } from "@/server/task-mutations";
import { moveTaskSchema } from "@/lib/validations/task";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/tasks/:id/move  { status, beforeId?, afterId? } */
export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const move = moveTaskSchema.parse(await req.json());
  const result = await moveTask({ id: user.id, name: user.name }, id, move);
  return ok(result);
});
