import type { NotificationType } from "@prisma/client";

/** Types de notification que l'utilisateur peut désactiver. */
export const CONFIGURABLE_TYPES: {
  type: NotificationType;
  label: string;
  description: string;
}[] = [
  { type: "TASK_ASSIGNED", label: "Tâche assignée", description: "Quand on vous assigne une tâche." },
  { type: "TASK_COMMENTED", label: "Commentaire sur une tâche", description: "Nouveau commentaire sur une tâche que vous suivez." },
  { type: "TASK_DUE_SOON", label: "Échéance proche", description: "Rappel automatique 48 h avant l'échéance." },
  { type: "MENTION", label: "Mention", description: "Quand quelqu'un vous mentionne avec @." },
  { type: "COMMENT_REPLY", label: "Réponse à un commentaire", description: "Réponse à l'un de vos commentaires." },
  { type: "PROJECT_ADDED", label: "Ajout à un projet", description: "Quand on vous ajoute à un projet ou un événement." },
  { type: "ROLE_CHANGED", label: "Changement de rôle", description: "Quand votre rôle dans une organisation change." },
  { type: "INVITATION", label: "Invitations", description: "Activité liée aux invitations." },
];

export type NotificationPrefs = Partial<Record<NotificationType, { inApp: boolean }>>;

/** true si la notification `type` doit être créée pour cet utilisateur. */
export function isTypeEnabled(prefs: unknown, type: NotificationType): boolean {
  if (!prefs || typeof prefs !== "object") return true; // défaut : tout activé
  const entry = (prefs as NotificationPrefs)[type];
  if (!entry || typeof entry.inApp !== "boolean") return true;
  return entry.inApp;
}

/** Normalise les préférences pour l'affichage (toutes les clés présentes). */
export function normalizePrefs(prefs: unknown): Record<NotificationType, { inApp: boolean }> {
  const out = {} as Record<NotificationType, { inApp: boolean }>;
  for (const { type } of CONFIGURABLE_TYPES) {
    out[type] = { inApp: isTypeEnabled(prefs, type) };
  }
  return out;
}
