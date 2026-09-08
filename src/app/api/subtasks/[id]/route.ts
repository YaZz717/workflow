import { handleRoute, ok, noContent } from "@/lib/http";
import { requireUser } from "@/server/context";
import { updateSubtask, deleteSubtask } from "@/server/task-mutations";
import { updateSubtaskSchema } from "@/lib/validations/task";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const patch = updateSubtaskSchema.parse(await req.json());
  const subtask = await updateSubtask({ id: user.id, name: user.name }, id, patch);
  return ok({ subtask });
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteSubtask({ id: user.id, name: user.name }, id);
  return noContent();
});
