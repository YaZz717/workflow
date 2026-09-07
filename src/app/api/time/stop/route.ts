import { handleRoute, ok } from "@/lib/http";
import { requireUser } from "@/server/context";
import { stopTimer } from "@/server/time";

/** POST /api/time/stop */
export const POST = handleRoute(async () => {
  const user = await requireUser();
  const entry = await stopTimer(user.id);
  return ok({ entry });
});
