import { handleRoute, created } from "@/lib/http";
import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { createFolder } from "@/server/documents";
import { createFolderSchema } from "@/lib/validations/document";

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const org = await getActiveOrganization();
  const input = createFolderSchema.parse(await req.json());
  const folder = await createFolder({ id: user.id, name: user.name }, org.id, {
    name: input.name,
    projectId: input.projectId ?? null,
    parentId: input.parentId ?? null,
  });
  return created({ folder });
});
