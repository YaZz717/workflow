import type { NextRequest } from "next/server";

import { handleRoute, ok } from "@/lib/http";
import { requireOrgMember } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { getMyTasks } from "@/server/tasks";
import { myTasksQuerySchema } from "@/lib/validations/task";

/** GET /api/tasks — tâches de l'utilisateur dans l'organisation active. */
export const GET = handleRoute(async (req: NextRequest) => {
  const org = await getActiveOrganization();
  const ctx = await requireOrgMember(org.id);
  const sp = req.nextUrl.searchParams;

  const q = myTasksQuerySchema.parse({
    scope: sp.get("scope") ?? undefined,
    status: sp.get("status") ?? undefined,
    projectId: sp.get("projectId") ?? undefined,
    overdue: sp.get("overdue") ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    page: sp.get("page") ?? undefined,
  });

  const result = await getMyTasks(org.id, ctx.user.id, {
    scope: q.scope,
    status: q.status,
    projectId: q.projectId,
    overdue: q.overdue === "1",
    q: q.q,
    sort: q.sort === "due" ? "due" : q.sort === "priority" ? "priority" : q.sort === "updated" ? "updated" : "created",
    page: q.page,
  });
  return ok(result);
});
