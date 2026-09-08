import { handleRoute, created } from "@/lib/http";
import { requireUser } from "@/server/context";
import { addSubtask } from "@/server/task-mutations";
import { createSubtaskSchema } from "@/lib/validations/task";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const { title } = createSubtaskSchema.parse(await req.json());
  const subtask = await addSubtask({ id: user.id, name: user.name }, id, title);
  return created({ subtask });
});
