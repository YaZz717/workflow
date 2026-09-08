import { handleRoute, ok, noContent, Errors } from "@/lib/http";
import { requireUser, requireTaskAccess } from "@/server/context";
import { getTaskDetail } from "@/server/tasks";
import { updateTask, deleteTask } from "@/server/task-mutations";
import { updateTaskSchema } from "@/lib/validations/task";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await requireTaskAccess(id);
  const task = await getTaskDetail(id);
  if (!task) throw Errors.notFound();
  return ok({ task });
});

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const input = updateTaskSchema.parse(await req.json());
  const result = await updateTask({ id: user.id, name: user.name }, id, input);
  const task = await getTaskDetail(id);
  return ok({ task, ...result });
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteTask({ id: user.id, name: user.name }, id);
  return noContent();
});
