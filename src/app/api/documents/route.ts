import type { NextRequest } from "next/server";

import { handleRoute, ok, created } from "@/lib/http";
import { requireUser, requireOrgMember } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast } from "@/lib/permissions";
import { listDocuments, createDocument } from "@/server/documents";
import { createDocumentSchema, documentListQuerySchema } from "@/lib/validations/document";

export const GET = handleRoute(async (req: NextRequest) => {
  const org = await getActiveOrganization();
  const ctx = await requireOrgMember(org.id);
  const sp = req.nextUrl.searchParams;
  const q = documentListQuerySchema.parse({
    projectId: sp.get("projectId") ?? undefined,
    folderId: sp.get("folderId") ?? undefined,
    scope: sp.get("scope") ?? undefined,
    q: sp.get("q") ?? undefined,
    archived: sp.get("archived") ?? undefined,
  });

  const result = await listDocuments(org.id, ctx.user.id, orgRoleAtLeast(ctx.role, "MANAGER"), {
    projectId: q.projectId,
    folderId: q.folderId,
    q: q.q,
    archived: q.archived === "1",
  });
  return ok(result);
});

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const input = createDocumentSchema.parse(await req.json());
  const doc = await createDocument({ id: user.id, name: user.name }, org.id, {
    title: input.title,
    content: input.content || "",
    projectId: input.projectId ?? null,
    folderId: input.folderId ?? null,
  });
  return created({ document: doc });
});
