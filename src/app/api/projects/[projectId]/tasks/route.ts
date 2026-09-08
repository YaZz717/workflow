import type { NextRequest } from "next/server";

import { handleRoute, ok, created } from "@/lib/http";
import { requireUser, requireProjectAccess } from "@/server/context";
import { getProjectBoard, getProjectTaskList } from "@/server/tasks";
import { createTask } from "@/server/task-mutations";
import { createTaskSchema, taskListQuerySchema } from "@/lib/validations/task";

type Ctx = { params: Promise<{ projectId: string }> };

export const GET = handleRoute(async (req: NextRequest, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  await requireProjectAccess(projectId);

  const sp = req.nextUrl.searchParams;
  const query = taskListQuerySchema.parse({
    view: sp.get("view") ?? undefined,
    q: sp.get("q") ?? undefined,
    status: sp.get("status") ?? undefined,
    priority: sp.get("priority") ?? undefined,
    assigneeId: sp.get("assigneeId") ?? undefined,
    tagId: sp.get("tagId") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    page: sp.get("page") ?? undefined,
  });

  if (query.view === "board") {
    return ok({ tasks: await getProjectBoard(projectId) });
  }
  return ok(await getProjectTaskList(projectId, query));
});

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  const user = await requireUser();
  const input = createTaskSchema.parse(await req.json());
  const task = await createTask({ id: user.id, name: user.name }, projectId, input);
  return created({ task });
});
