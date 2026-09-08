import { cache } from "react";
import { headers } from "next/headers";
import type { OrgRole } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/http";
import { can, orgRoleAtLeast, type OrgCapability } from "@/lib/permissions";

/** Session courante (mémoïsée le temps d'une requête). */
export const getSession = cache(async () => auth());

/** Utilisateur courant ou `null`. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      globalRole: true,
      isActive: true,
      emailVerified: true,
      locale: true,
      timezone: true,
    },
  });
  if (!user || !user.isActive) return null;
  return user;
});

/** Comme `getCurrentUser` mais lève 401 si absent. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw Errors.unauthorized();
  return user;
}

export async function requireGlobalAdmin() {
  const user = await requireUser();
  if (user.globalRole !== "ADMIN") throw Errors.forbidden("Réservé aux administrateurs");
  return user;
}

export type OrgContext = {
  user: Awaited<ReturnType<typeof requireUser>>;
  organizationId: string;
  role: OrgRole;
  membershipId: string;
};

/**
 * Vérifie que l'utilisateur courant est membre de l'organisation.
 * Empêche tout accès inter-organisation (IDOR).
 */
export async function requireOrgMember(organizationId: string): Promise<OrgContext> {
  const user = await requireUser();
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!membership) throw Errors.notFound("Organisation introuvable");
  return { user, organizationId, role: membership.role, membershipId: membership.id };
}

export async function requireOrgRole(
  organizationId: string,
  minRole: OrgRole,
): Promise<OrgContext> {
  const ctx = await requireOrgMember(organizationId);
  if (!orgRoleAtLeast(ctx.role, minRole)) {
    throw Errors.forbidden(`Rôle ${minRole} minimum requis`);
  }
  return ctx;
}

export async function requireOrgCapability(
  organizationId: string,
  capability: OrgCapability,
): Promise<OrgContext> {
  const ctx = await requireOrgMember(organizationId);
  if (!can(ctx.role, capability)) {
    throw Errors.forbidden("Vous n'avez pas la permission pour cette action");
  }
  return ctx;
}

/**
 * Vérifie l'accès à un projet : membre de l'org ET (membre du projet OU rôle
 * org >= MANAGER). Renvoie le projet et le rôle projet effectif.
 */
export const requireProjectAccess = cache(async (projectId: string) => {
  const user = await requireUser();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { where: { userId: user.id } },
      organization: {
        select: {
          members: { where: { userId: user.id }, select: { role: true } },
        },
      },
    },
  });

  const orgMembership = project?.organization.members[0];
  if (!project || !orgMembership) throw Errors.notFound("Projet introuvable");

  const projectMembership = project.members[0];
  const isOrgManager = orgRoleAtLeast(orgMembership.role, "MANAGER");
  if (!projectMembership && !isOrgManager) {
    throw Errors.forbidden("Vous n'êtes pas membre de ce projet");
  }

  return {
    user,
    project,
    orgRole: orgMembership.role,
    projectRole: projectMembership?.role ?? (isOrgManager ? "LEAD" : "VIEWER"),
  };
});

/**
 * Vérifie l'accès à une tâche via son projet. Renvoie la tâche, son projet
 * et les rôles effectifs. Lève 404 si la tâche n'existe pas ou est hors périmètre.
 */
export const requireTaskAccess = cache(async (taskId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, number: true, title: true, status: true },
  });
  if (!task) throw Errors.notFound("Tâche introuvable");
  const access = await requireProjectAccess(task.projectId);
  return { ...access, task };
});

/** IP du client (best-effort, derrière proxy). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "0.0.0.0"
  );
}
