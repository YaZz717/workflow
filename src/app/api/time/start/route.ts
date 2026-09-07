import { z } from "zod";

import { handleRoute, created } from "@/lib/http";
import { requireUser } from "@/server/context";
import { startTimer } from "@/server/time";

const bodySchema = z.object({ taskId: z.string().cuid() });

/** POST /api/time/start  { taskId } */
export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const { taskId } = bodySchema.parse(await req.json());
  const entry = await startTimer(user.id, taskId);
  return created({ entry });
});
