import { z } from "zod";

export const ORG_ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "GUEST"] as const;
/** Rôles qu'on peut attribuer via une invitation (pas OWNER). */
export const INVITABLE_ROLES = ["ADMIN", "MANAGER", "MEMBER", "GUEST"] as const;

export const inviteMemberSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase(),
  role: z.enum(INVITABLE_ROLES).default("MEMBER"),
});

export const updateMemberRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ORG_ROLES),
});
