import type { NextRequest } from "next/server";

import { handleRoute, ok } from "@/lib/http";
import { requireOrgMember } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { getBillableStats } from "@/server/time";

/** Montant facturable org-wide — réservé aux managers (donnée financière). */
export const GET = handleRoute(async (req: NextRequest) => {
  const org = await getActiveOrganization();
  const ctx = await requireOrgMember(org.id);
  if (!orgRoleAtLeast(ctx.role, "MANAGER")) {
    return ok({ billableSec: 0, nonBillableSec: 0, amountCents: 0, currency: "EUR", byProject: [] });
  }

  const sp = req.nextUrl.searchParams;
  const stats = await getBillableStats(org.id, {
    projectId: sp.get("projectId") || undefined,
  });
  return ok(stats);
});
