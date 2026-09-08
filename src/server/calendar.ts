import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/http";
import { requireProjectAccess } from "@/server/context";
import { orgRoleAtLeast } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

type Actor = { id: string; name: string | null };

/** Projets visibles par l'utilisateur (pour filtrer événements & deadlines). */
async function visibleProjectIds(
  organizationId: string,
  userId: string,
  isManager: boolean,
): Promise<string[]> {
  const projects = await prisma.project.findMany({
    where: {
      organizationId,
      ...(isManager ? {} : { members: { some: { userId } } }),
    },
    select: { id: true },
  });
  return projects.map((p) => p.id);
}

export async function getCalendarItems(
  organizationId: string,
  userId: string,
  isManager: boolean,
  from: Date,
  to: Date,
) {
  const projectIds = await visibleProjectIds(organizationId, userId, isManager);

  const [events, deadlines] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        organizationId,
        startAt: { lte: to },
        endAt: { gte: from },
        OR: [{ projectId: null }, { projectId: { in: projectIds } }],
      },
      orderBy: { startAt: "asc" },
      include: {
        organizer: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, key: true, name: true, color: true } },
        attendees: true,
      },
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: "DONE" },
        dueDate: { gte: from, lte: to },
      },
      select: {
        id: true,
        number: true,
        title: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, key: true, name: true, color: true } },
      },
    }),
  ]);

  return {
    events: events.map((e) => ({
      id: e.id,
      kind: "event" as const,
      title: e.title,
      description: e.description,
      type: e.type,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt.toISOString(),
      allDay: e.allDay,
      location: e.location,
      organizer: e.organizer,
      project: e.project,
      attendeeCount: e.attendees.length,
      canManage: e.organizerId === userId || isManager,
      href: e.project ? `/projects/${e.project.id}` : null,
    })),
    deadlines: deadlines.map((t) => ({
      id: t.id,
      kind: "deadline" as const,
      title: t.title,
      ref: `${t.project.key}-${t.number}`,
      priority: t.priority,
      dueDate: t.dueDate!.toISOString(),
      project: t.project,
      href: `/projects/${t.project.id}/tasks/${t.id}`,
    })),
  };
}

async function assertEventScope(actor: Actor, organizationId: string, projectId?: string | null) {
  if (projectId) {
    const { orgRole, projectRole } = await requireProjectAccess(projectId);
    if (projectRole === "VIEWER" && !orgRoleAtLeast(orgRole, "MANAGER")) {
      throw Errors.forbidden();
    }
  } else {
    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: actor.id } },
    });
    if (!membership) throw Errors.forbidden();
  }
}

export async function createEvent(
  actor: Actor,
  organizationId: string,
  input: {
    title: string;
    description?: string;
    type: "MEETING" | "DEADLINE" | "EVENT" | "REMINDER";
    startAt: string;
    endAt: string;
    allDay: boolean;
    location?: string;
    projectId?: string | null;
    attendeeIds: string[];
  },
) {
  await assertEventScope(actor, organizationId, input.projectId);

  // Les participants doivent être membres de l'organisation.
  const validAttendees = input.attendeeIds.length
    ? await prisma.organizationMember.findMany({
        where: { organizationId, userId: { in: input.attendeeIds } },
        select: { userId: true },
      })
    : [];

  const event = await prisma.calendarEvent.create({
    data: {
      organizationId,
      projectId: input.projectId ?? null,
      organizerId: actor.id,
      title: input.title,
      description: input.description || null,
      type: input.type,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      allDay: input.allDay,
      location: input.location || null,
      attendees: {
        create: validAttendees.map((a) => ({ userId: a.userId, status: "invited" })),
      },
    },
  });

  await recordAudit({
    organizationId,
    actorId: actor.id,
    action: "calendar.event_create",
    resourceType: "CalendarEvent",
    resourceId: event.id,
    summary: `${actor.name} a créé l'événement « ${event.title} »`,
  });
  await notify({
    organizationId,
    recipientIds: validAttendees.map((a) => a.userId),
    actorId: actor.id,
    type: "PROJECT_ADDED",
    title: `Invitation : ${event.title}`,
    body: new Date(input.startAt).toLocaleString("fr-FR"),
    link: "/calendar",
    entityType: "CalendarEvent",
    entityId: event.id,
  });

  return event;
}

async function loadEventForWrite(actor: Actor, eventId: string) {
  const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!event) throw Errors.notFound();
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: event.organizationId, userId: actor.id } },
  });
  if (!membership) throw Errors.notFound();
  const allowed = event.organizerId === actor.id || orgRoleAtLeast(membership.role, "MANAGER");
  if (!allowed) throw Errors.forbidden("Seul l'organisateur peut modifier cet événement.");
  return event;
}

export async function updateEvent(
  actor: Actor,
  eventId: string,
  patch: Partial<{
    title: string;
    description: string | null;
    type: "MEETING" | "DEADLINE" | "EVENT" | "REMINDER";
    startAt: string;
    endAt: string;
    allDay: boolean;
    location: string | null;
    projectId: string | null;
    attendeeIds: string[];
  }>,
) {
  const event = await loadEventForWrite(actor, eventId);

  const data: Prisma.CalendarEventUpdateInput = {
    title: patch.title,
    description: patch.description === undefined ? undefined : patch.description,
    type: patch.type,
    startAt: patch.startAt ? new Date(patch.startAt) : undefined,
    endAt: patch.endAt ? new Date(patch.endAt) : undefined,
    allDay: patch.allDay,
    location: patch.location === undefined ? undefined : patch.location,
  };

  if (patch.attendeeIds) {
    const valid = await prisma.organizationMember.findMany({
      where: { organizationId: event.organizationId, userId: { in: patch.attendeeIds } },
      select: { userId: true },
    });
    data.attendees = {
      deleteMany: {},
      create: valid.map((a) => ({ userId: a.userId, status: "invited" })),
    };
  }

  const updated = await prisma.calendarEvent.update({ where: { id: eventId }, data });
  await recordAudit({
    organizationId: event.organizationId,
    actorId: actor.id,
    action: "calendar.event_update",
    resourceType: "CalendarEvent",
    resourceId: eventId,
    summary: `${actor.name} a modifié l'événement « ${updated.title} »`,
  });
  return updated;
}

export async function deleteEvent(actor: Actor, eventId: string) {
  const event = await loadEventForWrite(actor, eventId);
  await prisma.calendarEvent.delete({ where: { id: eventId } });
  await recordAudit({
    organizationId: event.organizationId,
    actorId: actor.id,
    action: "calendar.event_delete",
    resourceType: "CalendarEvent",
    resourceId: eventId,
    summary: `${actor.name} a supprimé l'événement « ${event.title} »`,
  });
}
