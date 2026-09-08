import { handleRoute, ok, noContent } from "@/lib/http";
import { requireUser } from "@/server/context";
import { updateEvent, deleteEvent } from "@/server/calendar";
import { updateEventSchema } from "@/lib/validations/calendar";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const input = updateEventSchema.parse(await req.json());
  const event = await updateEvent({ id: user.id, name: user.name }, id, {
    title: input.title,
    description: input.description === undefined ? undefined : input.description,
    type: input.type,
    startAt: input.startAt,
    endAt: input.endAt,
    allDay: input.allDay,
    location: input.location === undefined ? undefined : input.location,
    projectId: input.projectId === undefined ? undefined : input.projectId,
    attendeeIds: input.attendeeIds,
  });
  return ok({ event });
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteEvent({ id: user.id, name: user.name }, id);
  return noContent();
});
