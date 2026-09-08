"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getClientIp, requireOrgCapability } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { ORG_ROLE_RANK } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { generateToken, addDays } from "@/lib/tokens";
import { sendInvitationEmail } from "@/lib/auth/emails";
import { ORG_ROLE_LABEL } from "@/lib/constants";
import { inviteMemberSchema, updateMemberRoleSchema } from "@/lib/validations/organization";
import { actionError, actionOk, parseOrFail, type ActionResult } from "@/lib/actions";

export async function inviteMemberAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const org = await getActiveOrganization();
  const ctx = await requireOrgCapability(org.id, "member.invite");

  const parsed = parseOrFail(inviteMemberSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;
  const { email, role } = parsed.data;

  // Un ADMIN ne peut pas inviter un ADMIN (réservé au OWNER).
  if (role === "ADMIN" && ctx.role !== "OWNER") {
    return actionError("Seul le propriétaire peut inviter un administrateur.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: org.id, userId: existingUser.id } },
    });
    if (alreadyMember) return actionError("Cette personne est déjà membre de l'organisation.");
  }

  const { token, tokenHash } = generateToken();
  await prisma.invitation.upsert({
    where: { organizationId_email: { organizationId: org.id, email } },
    create: {
      organizationId: org.id,
      email,
      role,
      tokenHash,
      invitedById: ctx.user.id,
      expiresAt: addDays(7),
    },
    update: {
      role,
      tokenHash,
      status: "PENDING",
      invitedById: ctx.user.id,
      expiresAt: addDays(7),
    },
  });

  await sendInvitationEmail({
    to: email,
    token,
    organizationName: org.name,
    inviterName: ctx.user.name ?? ctx.user.email,
  });
  await recordAudit({
    organizationId: org.id,
    actorId: ctx.user.id,
    action: "member.invite",
    resourceType: "Invitation",
    summary: `${ctx.user.name} a invité ${email} (${ORG_ROLE_LABEL[role]})`,
    ip: await getClientIp(),
  });

  revalidatePath("/team");
  return actionOk(undefined, `Invitation envoyée à ${email}.`);
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  const org = await getActiveOrganization();
  const ctx = await requireOrgCapability(org.id, "member.invite");

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.organizationId !== org.id) return actionError("Invitation introuvable.");

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
  });
  await recordAudit({
    organizationId: org.id,
    actorId: ctx.user.id,
    action: "member.invite_revoke",
    resourceType: "Invitation",
    resourceId: invitationId,
    summary: `${ctx.user.name} a révoqué l'invitation de ${invitation.email}`,
    ip: await getClientIp(),
  });
  revalidatePath("/team");
  return actionOk(undefined, "Invitation révoquée.");
}

export async function updateMemberRoleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const org = await getActiveOrganization();
  const ctx = await requireOrgCapability(org.id, "member.role.update");

  const parsed = parseOrFail(updateMemberRoleSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;
  const { userId, role } = parsed.data;

  if (userId === ctx.user.id) return actionError("Vous ne pouvez pas changer votre propre rôle.");

  const target = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId } },
    include: { user: { select: { name: true } } },
  });
  if (!target) return actionError("Membre introuvable.");
  if (target.role === "OWNER") return actionError("Le rôle du propriétaire ne peut pas être modifié ici.");
  if (role === "OWNER") return actionError("Utilisez le transfert de propriété pour nommer un propriétaire.");

  const oldRole = target.role;
  await prisma.organizationMember.update({
    where: { organizationId_userId: { organizationId: org.id, userId } },
    data: { role },
  });
  await recordAudit({
    organizationId: org.id,
    actorId: ctx.user.id,
    action: "member.role_change",
    resourceType: "OrganizationMember",
    resourceId: userId,
    summary: `${ctx.user.name} a changé le rôle de ${target.user.name} de ${ORG_ROLE_LABEL[oldRole]} à ${ORG_ROLE_LABEL[role]}`,
    oldValue: { role: oldRole },
    newValue: { role },
    ip: await getClientIp(),
  });
  await prisma.notification.create({
    data: {
      organizationId: org.id,
      recipientId: userId,
      actorId: ctx.user.id,
      type: "ROLE_CHANGED",
      title: `Votre rôle est maintenant ${ORG_ROLE_LABEL[role]}`,
      body: `Dans l'organisation ${org.name}`,
      link: "/team",
    },
  });

  revalidatePath("/team");
  return actionOk(undefined, "Rôle mis à jour.");
}

export async function removeMemberAction(userId: string): Promise<ActionResult> {
  const org = await getActiveOrganization();
  const ctx = await requireOrgCapability(org.id, "member.remove");

  if (userId === ctx.user.id) return actionError("Vous ne pouvez pas vous retirer vous-même.");

  const target = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId } },
    include: { user: { select: { name: true } } },
  });
  if (!target) return actionError("Membre introuvable.");
  if (target.role === "OWNER") return actionError("Le propriétaire ne peut pas être retiré.");
  if (ORG_ROLE_RANK[target.role] >= ORG_ROLE_RANK[ctx.role]) {
    return actionError("Vous ne pouvez retirer qu'un membre de rang inférieur au vôtre.");
  }

  await prisma.$transaction([
    prisma.projectMember.deleteMany({ where: { userId, project: { organizationId: org.id } } }),
    prisma.taskAssignee.deleteMany({ where: { userId, task: { project: { organizationId: org.id } } } }),
    prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId: org.id, userId } },
    }),
  ]);
  await recordAudit({
    organizationId: org.id,
    actorId: ctx.user.id,
    action: "member.remove",
    resourceType: "OrganizationMember",
    resourceId: userId,
    summary: `${ctx.user.name} a retiré ${target.user.name} de l'organisation`,
    ip: await getClientIp(),
  });

  revalidatePath("/team");
  return actionOk(undefined, "Membre retiré de l'organisation.");
}
