import type { NextRequest } from "next/server";

import { handleRoute, ok } from "@/lib/http";
import { requireOrgMember } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { getCalendarItems } from "@/server/calendar";
import { calendarRangeSchema } from "@/lib/validations/calendar";

/** GET /api/calendar?from=ISO&to=ISO */
export const GET = handleRoute(async (req: NextRequest) => {
  const org = await getActiveOrganization();
  const ctx = await requireOrgMember(org.id);
  const { from, to } = calendarRangeSchema.parse({
    from: req.nextUrl.searchParams.get("from"),
    to: req.nextUrl.searchParams.get("to"),
  });

  const items = await getCalendarItems(
    org.id,
    ctx.user.id,
    orgRoleAtLeast(ctx.role, "MANAGER"),
    new Date(from),
    new Date(to),
  );
  return ok(items);
});
