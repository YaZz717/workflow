import { z } from "zod";

export const CALENDAR_EVENT_TYPES = ["MEETING", "DEADLINE", "EVENT", "REMINDER"] as const;

export const createEventSchema = z
  .object({
    title: z.string().min(1, "Titre requis").max(200),
    description: z.string().max(2000).optional().or(z.literal("")),
    type: z.enum(CALENDAR_EVENT_TYPES).default("MEETING"),
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    allDay: z.boolean().default(false),
    location: z.string().max(200).optional().or(z.literal("")),
    projectId: z.string().min(1).nullable().optional(),
    attendeeIds: z.array(z.string().min(1)).max(50).default([]),
  })
  .refine((d) => new Date(d.endAt) >= new Date(d.startAt), {
    message: "La fin doit être après le début",
    path: ["endAt"],
  });

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  type: z.enum(CALENDAR_EVENT_TYPES).optional(),
  startAt: z.string().min(1).optional(),
  endAt: z.string().min(1).optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(200).nullable().optional(),
  projectId: z.string().min(1).nullable().optional(),
  attendeeIds: z.array(z.string().min(1)).max(50).optional(),
});

export const calendarRangeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});
