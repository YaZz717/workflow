import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  summary: string;
  oldValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Enregistre une entrée dans le journal d'audit.
 * Ne doit jamais faire échouer l'action métier : les erreurs sont avalées.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId ?? null,
        actorId: input.actorId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        summary: input.summary,
        oldValue: input.oldValue ?? undefined,
        newValue: input.newValue ?? undefined,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] échec d'écriture :", err);
  }
}
