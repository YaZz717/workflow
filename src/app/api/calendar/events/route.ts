import { handleRoute, created } from "@/lib/http";
import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { createEvent } from "@/server/calendar";
import { createEventSchema } from "@/lib/validations/calendar";

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const input = createEventSchema.parse(await req.json());
  const event = await createEvent({ id: user.id, name: user.name }, org.id, {
    title: input.title,
    description: input.description || undefined,
    type: input.type,
    startAt: input.startAt,
    endAt: input.endAt,
    allDay: input.allDay,
    location: input.location || undefined,
    projectId: input.projectId ?? null,
    attendeeIds: input.attendeeIds,
  });
  return created({ event });
});
