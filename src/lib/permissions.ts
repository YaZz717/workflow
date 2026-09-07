import type { OrgRole, ProjectRole } from "@prisma/client";

/** Hiérarchie des rôles d'organisation (plus le nombre est élevé, plus de droits). */
export const ORG_ROLE_RANK: Record<OrgRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  GUEST: 1,
};

export const PROJECT_ROLE_RANK: Record<ProjectRole, number> = {
  LEAD: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function orgRoleAtLeast(role: OrgRole, min: OrgRole): boolean {
  return ORG_ROLE_RANK[role] >= ORG_ROLE_RANK[min];
}

export function projectRoleAtLeast(role: ProjectRole, min: ProjectRole): boolean {
  return PROJECT_ROLE_RANK[role] >= PROJECT_ROLE_RANK[min];
}

/**
 * Matrice de permissions applicative.
 * Chaque capacité liste le rôle d'organisation minimum requis.
 */
export const ORG_CAPABILITIES = {
  "org.update": "ADMIN",
  "org.delete": "OWNER",
  "org.billing": "OWNER",
  "member.invite": "ADMIN",
  "member.remove": "ADMIN",
  "member.role.update": "OWNER",
  "project.create": "MANAGER",
  "project.delete": "MANAGER",
  "project.update": "MANAGER",
  "tag.manage": "MANAGER",
  "task.create": "MEMBER",
  "task.update": "MEMBER",
  "task.delete": "MANAGER",
  "comment.create": "MEMBER",
  "document.create": "MEMBER",
  "document.delete": "MANAGER",
  "time.track": "MEMBER",
  "audit.read": "ADMIN",
} as const satisfies Record<string, OrgRole>;

export type OrgCapability = keyof typeof ORG_CAPABILITIES;

export function can(role: OrgRole, capability: OrgCapability): boolean {
  return orgRoleAtLeast(role, ORG_CAPABILITIES[capability]);
}
