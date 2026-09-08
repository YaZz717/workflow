"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, getClientIp } from "@/server/context";
import { hashToken } from "@/lib/tokens";
import { recordAudit } from "@/lib/audit";
import { ACTIVE_ORG_COOKIE } from "@/server/organizations";
import { ORG_ROLE_LABEL } from "@/lib/constants";
import { actionError, actionOk, type ActionResult } from "@/lib/actions";

export async function acceptInvitationAction(token: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Vous devez être connecté pour accepter une invitation.");

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { id: true, name: true } } },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return actionError("Cette invitation est invalide, expirée ou déjà utilisée.");
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return actionError(
      `Cette invitation a été envoyée à ${invitation.email}. Connectez-vous avec ce compte.`,
    );
  }

  const existing = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
  });
  if (existing) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
    return actionOk(undefined, "Vous faites déjà partie de cette organisation.");
  }

  await prisma.$transaction([
    prisma.organizationMember.create({
      data: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
  ]);

  await recordAudit({
    organizationId: invitation.organizationId,
    actorId: user.id,
    action: "member.join",
    resourceType: "OrganizationMember",
    resourceId: user.id,
    summary: `${user.name ?? user.email} a rejoint l'organisation (${ORG_ROLE_LABEL[invitation.role]}) via invitation`,
    ip: await getClientIp(),
  });
  await prisma.notification.create({
    data: {
      organizationId: invitation.organizationId,
      recipientId: invitation.invitedById,
      actorId: user.id,
      type: "INVITATION",
      title: `${user.name ?? user.email} a rejoint ${invitation.organization.name}`,
      link: "/team",
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, invitation.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}

export async function declineInvitationAction(token: string): Promise<ActionResult> {
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
  if (invitation && invitation.status === "PENDING") {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "DECLINED" } });
  }
  return actionOk(undefined, "Invitation déclinée.");
}
