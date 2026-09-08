import { handleRoute, ok, created } from "@/lib/http";
import { requireUser, requireOrgCapability, requireOrgMember } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { listOrgTags, createTag } from "@/server/task-mutations";
import { createTagSchema } from "@/lib/validations/task";

export const GET = handleRoute(async () => {
  const org = await getActiveOrganization();
  await requireOrgMember(org.id);
  return ok({ tags: await listOrgTags(org.id) });
});

export const POST = handleRoute(async (req: Request) => {
  const org = await getActiveOrganization();
  await requireOrgCapability(org.id, "tag.manage");
  const user = await requireUser();
  const input = createTagSchema.parse(await req.json());
  const tag = await createTag({ id: user.id, name: user.name }, org.id, input);
  return created({ tag });
});
