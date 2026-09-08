import type {
  Priority,
  ProjectStatus,
  TaskStatus,
  NotificationType,
  OrgRole,
} from "@prisma/client";

export const TASK_STATUS: Record<TaskStatus, { label: string; color: string }> = {
  BACKLOG: { label: "Backlog", color: "#94a3b8" },
  TODO: { label: "À faire", color: "#3b82f6" },
  IN_PROGRESS: { label: "En cours", color: "#f59e0b" },
  REVIEW: { label: "En revue", color: "#a855f7" },
  DONE: { label: "Terminé", color: "#22c55e" },
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
];

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; color: string }> = {
  PLANNING: { label: "Planification", color: "#94a3b8" },
  ACTIVE: { label: "Actif", color: "#22c55e" },
  ON_HOLD: { label: "En pause", color: "#f59e0b" },
  COMPLETED: { label: "Terminé", color: "#3b82f6" },
  ARCHIVED: { label: "Archivé", color: "#64748b" },
};

export const PRIORITY: Record<Priority, { label: string; color: string; rank: number }> = {
  LOW: { label: "Basse", color: "#64748b", rank: 1 },
  MEDIUM: { label: "Moyenne", color: "#3b82f6", rank: 2 },
  HIGH: { label: "Haute", color: "#f59e0b", rank: 3 },
  URGENT: { label: "Urgente", color: "#ef4444", rank: 4 },
};

export const ORG_ROLE_LABEL: Record<OrgRole, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  MEMBER: "Membre",
  GUEST: "Invité",
};

export const CALENDAR_EVENT: Record<
  "MEETING" | "DEADLINE" | "EVENT" | "REMINDER",
  { label: string; color: string }
> = {
  MEETING: { label: "Réunion", color: "#6366f1" },
  DEADLINE: { label: "Échéance", color: "#ef4444" },
  EVENT: { label: "Événement", color: "#14b8a6" },
  REMINDER: { label: "Rappel", color: "#f59e0b" },
};

export const NOTIFICATION_LABEL: Record<NotificationType, string> = {
  TASK_ASSIGNED: "Tâche assignée",
  TASK_COMMENTED: "Nouveau commentaire",
  TASK_DUE_SOON: "Échéance proche",
  MENTION: "Mention",
  PROJECT_ADDED: "Ajout à un projet",
  INVITATION: "Invitation",
  ROLE_CHANGED: "Changement de rôle",
  COMMENT_REPLY: "Réponse à un commentaire",
};
