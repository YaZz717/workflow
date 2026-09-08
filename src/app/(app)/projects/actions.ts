"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  getClientIp,
  requireOrgCapability,
  requireOrgMember,
  requireProjectAccess,
} from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { orgRoleAtLeast, projectRoleAtLeast } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { projectKeyFromName } from "@/lib/utils";
import { PROJECT_STATUS } from "@/lib/constants";
import {
  createProjectSchema,
  projectMemberSchema,
  updateProjectSchema,
} from "@/lib/validations/project";
import { actionError, actionOk, parseOrFail, type ActionResult } from "@/lib/actions";

async function uniqueProjectKey(organizationId: string, base: string): Promise<string> {
  const root = base.replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PRJ";
  let candidate = root;
  let i = 2;
  while (await prisma.project.findUnique({ where: { organizationId_key: { organizationId, key: candidate } } })) {
    candidate = `${root.slice(0, 4)}${i++}`;
  }
  return candidate;
}

/** L'utilisateur peut-il administrer ce projet ? (LEAD du projet ou MANAGER+ de l'org) */
function canManageProject(orgRole: string, projectRole: string): boolean {
  return (
    orgRoleAtLeast(orgRole as never, "MANAGER") ||
    projectRoleAtLeast(projectRole as never, "LEAD")
  );
}

// ---------------------------------------------------------------------------

export async function createProjectAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const org = await getActiveOrganization();
  const ctx = await requireOrgCapability(org.id, "project.create");

  const raw = {
    ...Object.fromEntries(formData),
    memberIds: formData.getAll("memberIds").map(String).filter(Boolean),
  };
  const parsed = parseOrFail(createProjectSchema, raw);
  if (!parsed.success) return parsed.result;
  const data = parsed.data;

  // Les membres doivent appartenir à l'organisation.
  const memberIds = new Set(data.memberIds);
  if (data.leadId) memberIds.add(data.leadId);
  memberIds.add(ctx.user.id);

  const validMembers = await prisma.organizationMember.findMany({
    where: { organizationId: org.id, userId: { in: [...memberIds] } },
    select: { userId: true },
  });
  const validIds = new Set(validMembers.map((m) => m.userId));
  if (data.leadId && !validIds.has(data.leadId)) {
    return actionError("Le responsable choisi n'est pas membre de l'organisation.");
  }

  const key = data.key
    ? await uniqueProjectKey(org.id, data.key)
    : await uniqueProjectKey(org.id, projectKeyFromName(data.name));

  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      key,
      name: data.name,
      description: data.description || null,
      color: data.color,
      priority: data.priority,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      leadId: data.leadId || null,
      createdById: ctx.user.id,
      taskCounter: { create: { next: 1 } },
      members: {
        create: [...validIds].map((userId) => ({
          userId,
          role: userId === data.leadId ? "LEAD" : "MEMBER",
        })),
      },
    },
  });

  await recordAudit({
    organizationId: org.id,
    actorId: ctx.user.id,
    action: "project.create",
    resourceType: "Project",
    resourceId: project.id,
    summary: `${ctx.user.name} a créé le projet « ${project.name} » (${key})`,
    ip: await getClientIp(),
  });
  await notify({
    organizationId: org.id,
    recipientIds: [...validIds],
    actorId: ctx.user.id,
    type: "PROJECT_ADDED",
    title: `Ajouté au projet ${project.name}`,
    body: data.description || null,
    link: `/projects/${project.id}`,
    entityType: "Project",
    entityId: project.id,
  });

  revalidatePath("/projects");
  return actionOk({ id: project.id }, "Projet créé.");
}

// ---------------------------------------------------------------------------

export async function updateProjectAction(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { project, orgRole, projectRole, user } = await requireProjectAccess(projectId);
  if (!canManageProject(orgRole, projectRole)) {
    return actionError("Vous n'avez pas la permission de modifier ce projet.");
  }

  const parsed = parseOrFail(updateProjectSchema, {
    ...Object.fromEntries(formData),
    description: formData.get("description") ?? undefined,
    leadId: formData.get("leadId") || null,
  });
  if (!parsed.success) return parsed.result;
  const data = parsed.data;

  if (data.leadId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: data.leadId } },
    });
    if (!isMember) {
      await prisma.projectMember.create({
        data: { projectId, userId: data.leadId, role: "LEAD" },
      });
    }
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      priority: data.priority,
      status: data.status,
      startDate: data.startDate ?? undefined,
      endDate: data.endDate ?? undefined,
      leadId: data.leadId,
      archivedAt: data.status === "ARCHIVED" ? new Date() : data.status ? null : undefined,
    },
  });

  const changes: string[] = [];
  if (data.status && data.status !== project.status)
    changes.push(`statut → ${PROJECT_STATUS[data.status].label}`);
  if (data.priority && data.priority !== project.priority) changes.push(`priorité → ${data.priority}`);

  await recordAudit({
    organizationId: project.organizationId,
    actorId: user.id,
    action: "project.update",
    resourceType: "Project",
    resourceId: projectId,
    summary: `${user.name} a modifié le projet « ${updated.name} »${changes.length ? ` (${changes.join(", ")})` : ""}`,
    oldValue: { status: project.status, priority: project.priority },
    newValue: { status: updated.status, priority: updated.priority },
    ip: await getClientIp(),
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return actionOk(undefined, "Projet mis à jour.");
}

// ---------------------------------------------------------------------------

export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
  const { project, orgRole, user } = await requireProjectAccess(projectId);
  if (!orgRoleAtLeast(orgRole, "MANAGER")) {
    return actionError("Seuls les managers peuvent supprimer un projet.");
  }

  await prisma.project.delete({ where: { id: projectId } });
  await recordAudit({
    organizationId: project.organizationId,
    actorId: user.id,
    action: "project.delete",
    resourceType: "Project",
    resourceId: projectId,
    summary: `${user.name} a supprimé le projet « ${project.name} » (${project.key})`,
    ip: await getClientIp(),
  });

  revalidatePath("/projects");
  return actionOk(undefined, "Projet supprimé.");
}

// ---------------------------------------------------------------------------

export async function addProjectMemberAction(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { project, orgRole, projectRole, user } = await requireProjectAccess(projectId);
  if (!canManageProject(orgRole, projectRole)) return actionError("Permission refusée.");

  const parsed = parseOrFail(projectMemberSchema, Object.fromEntries(formData));
  if (!parsed.success) return parsed.result;

  const orgMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: project.organizationId, userId: parsed.data.userId } },
    include: { user: { select: { name: true } } },
  });
  if (!orgMember) return actionError("Cette personne n'est pas membre de l'organisation.");

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: parsed.data.userId } },
    create: { projectId, userId: parsed.data.userId, role: parsed.data.role },
    update: { role: parsed.data.role },
  });

  await recordAudit({
    organizationId: project.organizationId,
    actorId: user.id,
    action: "project.member_add",
    resourceType: "Project",
    resourceId: projectId,
    summary: `${user.name} a ajouté ${orgMember.user.name} au projet « ${project.name} »`,
    ip: await getClientIp(),
  });
  await notify({
    organizationId: project.organizationId,
    recipientIds: [parsed.data.userId],
    actorId: user.id,
    type: "PROJECT_ADDED",
    title: `Ajouté au projet ${project.name}`,
    link: `/projects/${projectId}`,
    entityType: "Project",
    entityId: projectId,
  });

  revalidatePath(`/projects/${projectId}/members`);
  return actionOk(undefined, "Membre ajouté.");
}

export async function updateProjectMemberRoleAction(
  projectId: string,
  userId: string,
  role: "LEAD" | "MEMBER" | "VIEWER",
): Promise<ActionResult> {
  const { orgRole, projectRole, project, user } = await requireProjectAccess(projectId);
  if (!canManageProject(orgRole, projectRole)) return actionError("Permission refusée.");

  await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
  });
  if (role === "LEAD") {
    await prisma.project.update({ where: { id: projectId }, data: { leadId: userId } });
  }
  await recordAudit({
    organizationId: project.organizationId,
    actorId: user.id,
    action: "project.member_role",
    resourceType: "Project",
    resourceId: projectId,
    summary: `${user.name} a changé un rôle projet en ${role} sur « ${project.name} »`,
    ip: await getClientIp(),
  });
  revalidatePath(`/projects/${projectId}/members`);
  return actionOk(undefined, "Rôle mis à jour.");
}

export async function removeProjectMemberAction(
  projectId: string,
  userId: string,
): Promise<ActionResult> {
  const { orgRole, projectRole, project, user } = await requireProjectAccess(projectId);
  if (!canManageProject(orgRole, projectRole)) return actionError("Permission refusée.");
  if (project.leadId === userId) {
    return actionError("Retirez d'abord le rôle de responsable avant de retirer ce membre.");
  }

  await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
  await prisma.taskAssignee.deleteMany({ where: { userId, task: { projectId } } });

  await recordAudit({
    organizationId: project.organizationId,
    actorId: user.id,
    action: "project.member_remove",
    resourceType: "Project",
    resourceId: projectId,
    summary: `${user.name} a retiré un membre du projet « ${project.name} »`,
    ip: await getClientIp(),
  });
  revalidatePath(`/projects/${projectId}/members`);
  return actionOk(undefined, "Membre retiré.");
}

// ---------------------------------------------------------------------------

/** Liste des membres de l'organisation active (pour les sélecteurs). */
export async function listOrgMembersForPicker(): Promise<
  { id: string; name: string | null; email: string; image: string | null }[]
> {
  const org = await getActiveOrganization();
  await requireOrgMember(org.id);
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: org.id },
    orderBy: { user: { name: "asc" } },
    select: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
  return members.map((m) => m.user);
}
