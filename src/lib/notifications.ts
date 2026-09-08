import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotifyInput = {
  organizationId: string;
  recipientIds: string[];
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
};

/**
 * Crée une notification pour chaque destinataire (sauf l'acteur lui-même).
 * N'échoue jamais l'action métier appelante.
 */
export async function notify(input: NotifyInput): Promise<void> {
  const recipients = [...new Set(input.recipientIds)].filter((id) => id && id !== input.actorId);
  if (recipients.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: recipients.map((recipientId) => ({
        organizationId: input.organizationId,
        recipientId,
        actorId: input.actorId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      })),
    });
  } catch (err) {
    console.error("[notify] échec :", err);
  }
}
