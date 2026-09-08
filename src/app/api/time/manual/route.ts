import { handleRoute, created } from "@/lib/http";
import { requireUser } from "@/server/context";
import { addManualEntry } from "@/server/time";
import { manualEntrySchema } from "@/lib/validations/time";

/** POST /api/time/manual  { taskId, date, durationMinutes, description? } */
export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const input = manualEntrySchema.parse(await req.json());
  const entry = await addManualEntry(
    { id: user.id, name: user.name },
    {
      taskId: input.taskId,
      date: input.date,
      durationMinutes: input.durationMinutes,
      description: input.description || undefined,
    },
  );
  return created({ entry });
});
