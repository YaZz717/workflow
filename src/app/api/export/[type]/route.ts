import type { NextRequest } from "next/server";

import { handleRoute, Errors } from "@/lib/http";
import { csvResponse } from "@/lib/csv";
import { requireOrgMember } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { exportProjectsCsv, exportTasksCsv, exportTimeCsv } from "@/server/export";

type Ctx = { params: Promise<{ type: string }> };

/** GET /api/export/{projects|tasks|time}[?scope=me] — télécharge un CSV. */
export const GET = handleRoute(async (req: NextRequest, ctx: Ctx) => {
  const { type } = await ctx.params;
  const org = await getActiveOrganization();
  const membership = await requireOrgMember(org.id);
  const isManager = orgRoleAtLeast(membership.role, "MANAGER");
  const date = new Date().toISOString().slice(0, 10);
  const slug = org.slug;

  switch (type) {
    case "projects":
      return csvResponse(
        `${slug}-projets-${date}.csv`,
        await exportProjectsCsv(org.id, membership.user.id, isManager),
      );
    case "tasks":
      return csvResponse(
        `${slug}-taches-${date}.csv`,
        await exportTasksCsv(org.id, membership.user.id, isManager),
      );
    case "time":
      return csvResponse(
        `${slug}-temps-${date}.csv`,
        await exportTimeCsv(
          org.id,
          membership.user.id,
          isManager,
          req.nextUrl.searchParams.get("scope") === "me",
        ),
      );
    default:
      throw Errors.badRequest("Type d'export inconnu");
  }
});
