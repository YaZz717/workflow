import type { NextRequest } from "next/server";

import { handleRoute, ok } from "@/lib/http";
import { requireOrgMember } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { getTimeStats } from "@/server/time";
import { timeStatsQuerySchema } from "@/lib/validations/time";

export const GET = handleRoute(async (req: NextRequest) => {
  const org = await getActiveOrganization();
  const ctx = await requireOrgMember(org.id);
  const sp = req.nextUrl.searchParams;
  const { range, scope } = timeStatsQuerySchema.parse({
    range: sp.get("range") ?? undefined,
    scope: sp.get("scope") ?? undefined,
  });

  const stats = await getTimeStats(
    org.id,
    ctx.user.id,
    orgRoleAtLeast(ctx.role, "MANAGER"),
    range,
    scope,
  );
  return ok(stats);
});
