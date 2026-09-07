"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/server/context";
import { ACTIVE_ORG_COOKIE } from "@/server/organizations";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/** Change l'organisation active (stockée dans un cookie). */
export async function switchOrganization(organizationId: string) {
  const user = await requireUser();
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!membership) throw new Error("Organisation inaccessible");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
