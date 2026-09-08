import { prisma } from "@/lib/prisma";
import { TASK_STATUS, PROJECT_STATUS, PRIORITY } from "@/lib/constants";
import { toCsv } from "@/lib/csv";

/** Projets visibles par l'utilisateur dans l'organisation. */
async function scopedProjectIds(organizationId: string, userId: string, isManager: boolean) {
  const rows = await prisma.project.findMany({
    where: { organizationId, ...(isManager ? {} : { members: { some: { userId } } }) },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function exportProjectsCsv(organizationId: string, userId: string, isManager: boolean) {
  const ids = await scopedProjectIds(organizationId, userId, isManager);
  const projects = await prisma.project.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "asc" },
    include: {
      lead: { select: { name: true } },
      _count: { select: { members: true, tasks: true } },
      tasks: { select: { status: true } },
    },
  });

  const rows = projects.map((p) => {
    const done = p.tasks.filter((t) => t.status === "DONE").length;
    return [
      p.key,
      p.name,
      PROJECT_STATUS[p.status].label,
      PRIORITY[p.priority].label,
      p.lead?.name ?? "",
      p.startDate?.toISOString().slice(0, 10) ?? "",
      p.endDate?.toISOString().slice(0, 10) ?? "",
      p._count.members,
      p._count.tasks,
      done,
      p.tasks.length ? Math.round((done / p.tasks.length) * 100) + "%" : "0%",
    ];
  });

  return toCsv(
    ["Clé", "Nom", "Statut", "Priorité", "Responsable", "Début", "Fin", "Membres", "Tâches", "Terminées", "Avancement"],
    rows,
  );
}

export async function exportTasksCsv(organizationId: string, userId: string, isManager: boolean) {
  const ids = await scopedProjectIds(organizationId, userId, isManager);
  const tasks = await prisma.task.findMany({
    where: { projectId: { in: ids } },
    orderBy: [{ project: { key: "asc" } }, { number: "asc" }],
    include: {
      project: { select: { key: true, name: true } },
      createdBy: { select: { name: true } },
      assignees: { select: { user: { select: { name: true } } } },
      tags: { select: { tag: { select: { name: true } } } },
      timeEntries: { select: { durationSec: true } },
      _count: { select: { subtasks: true, comments: true } },
    },
  });

  const rows = tasks.map((t) => [
    `${t.project.key}-${t.number}`,
    t.project.name,
    t.title,
    TASK_STATUS[t.status].label,
    PRIORITY[t.priority].label,
    t.assignees.map((a) => a.user.name).join(", "),
    t.createdBy.name ?? "",
    t.dueDate?.toISOString().slice(0, 10) ?? "",
    t.estimateMinutes ? (t.estimateMinutes / 60).toFixed(1) + "h" : "",
    (t.timeEntries.reduce((s, e) => s + e.durationSec, 0) / 3600).toFixed(1) + "h",
    t.tags.map((x) => x.tag.name).join(", "),
    t._count.subtasks,
    t._count.comments,
    t.completedAt?.toISOString().slice(0, 10) ?? "",
  ]);

  return toCsv(
    ["Réf", "Projet", "Titre", "Statut", "Priorité", "Assignés", "Créateur", "Échéance", "Estimation", "Temps passé", "Tags", "Sous-tâches", "Commentaires", "Terminée le"],
    rows,
  );
}

export async function exportTimeCsv(
  organizationId: string,
  userId: string,
  isManager: boolean,
  onlyMine: boolean,
) {
  const ids = await scopedProjectIds(organizationId, userId, isManager);
  const entries = await prisma.timeEntry.findMany({
    where: {
      isRunning: false,
      task: { projectId: { in: ids } },
      ...(onlyMine || !isManager ? { userId } : {}),
    },
    orderBy: { startedAt: "desc" },
    include: {
      user: { select: { name: true } },
      task: { select: { number: true, title: true, project: { select: { key: true } } } },
    },
  });

  const rows = entries.map((e) => [
    e.startedAt.toISOString().slice(0, 10),
    e.user.name ?? "",
    `${e.task.project.key}-${e.task.number}`,
    e.task.title,
    (e.durationSec / 3600).toFixed(2),
    e.source === "manual" ? "manuel" : "chrono",
    e.description ?? "",
  ]);

  return toCsv(["Date", "Personne", "Tâche", "Titre", "Heures", "Source", "Description"], rows);
}
