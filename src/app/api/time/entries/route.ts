import type { NextRequest } from "next/server";

import { handleRoute, ok } from "@/lib/http";
import { requireOrgMember } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { listEntries } from "@/server/time";
import { timeEntriesQuerySchema } from "@/lib/validations/time";

export const GET = handleRoute(async (req: NextRequest) => {
  const org = await getActiveOrganization();
  const ctx = await requireOrgMember(org.id);
  const sp = req.nextUrl.searchParams;
  const q = timeEntriesQuerySchema.parse({
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    projectId: sp.get("projectId") ?? undefined,
    userId: sp.get("userId") ?? undefined,
    page: sp.get("page") ?? undefined,
  });

  const result = await listEntries(org.id, ctx.user.id, orgRoleAtLeast(ctx.role, "MANAGER"), q);
  return ok(result);
});
