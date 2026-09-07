import { cache } from "react";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/context";

export const ACTIVE_ORG_COOKIE = "workflow.activeOrg";

export const getUserOrganizations = cache(async () => {
  const user = await requireUser();
  return prisma.organizationMember.findMany({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          _count: { select: { projects: true, members: true } },
        },
      },
    },
  });
});

/**
 * Organisation active : lue depuis le cookie, sinon la première de l'utilisateur.
 * Lève une erreur si l'utilisateur n'appartient à aucune organisation.
 */
export const getActiveOrganization = cache(async () => {
  const memberships = await getUserOrganizations();
  if (memberships.length === 0) {
    throw new Error("NO_ORGANIZATION");
  }

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const active =
    memberships.find((m) => m.organization.id === wanted) ?? memberships[0];

  return { ...active.organization, role: active.role };
});
