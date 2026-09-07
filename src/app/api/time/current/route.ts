import { handleRoute, ok } from "@/lib/http";
import { requireUser } from "@/server/context";
import { getRunningTimer } from "@/server/time";

export const GET = handleRoute(async () => {
  const user = await requireUser();
  const timer = await getRunningTimer(user.id);
  return ok({ timer });
});
