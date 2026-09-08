import { handleRoute, ok, noContent } from "@/lib/http";
import { requireUser } from "@/server/context";
import { updateEntry, deleteEntry } from "@/server/time";
import { updateEntrySchema } from "@/lib/validations/time";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const patch = updateEntrySchema.parse(await req.json());
  const entry = await updateEntry({ id: user.id, name: user.name }, id, {
    durationMinutes: patch.durationMinutes,
    description: patch.description === undefined ? undefined : patch.description,
    date: patch.date,
  });
  return ok({ entry });
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteEntry({ id: user.id, name: user.name }, id);
  return noContent();
});
