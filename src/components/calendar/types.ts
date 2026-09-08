export type CalendarEventItem = {
  id: string;
  kind: "event";
  title: string;
  description: string | null;
  type: "MEETING" | "DEADLINE" | "EVENT" | "REMINDER";
  startAt: string;
  endAt: string;
  allDay: boolean;
  location: string | null;
  organizer: { id: string; name: string | null; image: string | null };
  project: { id: string; key: string; name: string; color: string } | null;
  attendeeCount: number;
  canManage: boolean;
  href: string | null;
};

export type CalendarDeadlineItem = {
  id: string;
  kind: "deadline";
  title: string;
  ref: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  project: { id: string; key: string; name: string; color: string };
  href: string;
};

export type CalendarItem = CalendarEventItem | CalendarDeadlineItem;

export function itemDate(i: CalendarItem): Date {
  return new Date(i.kind === "event" ? i.startAt : i.dueDate);
}
