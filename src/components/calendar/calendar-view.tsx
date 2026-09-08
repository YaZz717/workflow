"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { CALENDAR_EVENT, PRIORITY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { EventDialog } from "./event-dialog";
import { itemDate, type CalendarItem, type CalendarEventItem } from "./types";

const WEEK_OPTS = { weekStartsOn: 1 } as const;

export function CalendarView({
  projects,
  members,
}: {
  projects: { id: string; name: string }[];
  members: { id: string; name: string | null; email: string }[];
}) {
  const [view, setView] = React.useState<"month" | "week">("month");
  const [cursor, setCursor] = React.useState(new Date());
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEventItem | null>(null);
  const [createDate, setCreateDate] = React.useState<string | null>(null);

  const range = React.useMemo(() => {
    if (view === "week") {
      return { from: startOfWeek(cursor, WEEK_OPTS), to: endOfWeek(cursor, WEEK_OPTS) };
    }
    return {
      from: startOfWeek(startOfMonth(cursor), WEEK_OPTS),
      to: endOfWeek(endOfMonth(cursor), WEEK_OPTS),
    };
  }, [view, cursor]);

  const { data } = useQuery({
    queryKey: ["calendar", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar?from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
      );
      if (!res.ok) return { events: [], deadlines: [] };
      return (await res.json()).data as { events: CalendarEventItem[]; deadlines: CalendarItem[] };
    },
  });

  const items: CalendarItem[] = React.useMemo(
    () => [...(data?.events ?? []), ...(data?.deadlines ?? [])],
    [data],
  );

  const days = eachDayOfInterval({ start: range.from, end: range.to });

  function itemsForDay(day: Date) {
    return items
      .filter((i) => isSameDay(itemDate(i), day))
      .sort((a, b) => itemDate(a).getTime() - itemDate(b).getTime());
  }

  function shift(dir: -1 | 1) {
    setCursor((c) => (view === "week" ? addWeeks(c, dir) : addMonths(c, dir)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border p-0.5">
          {(["month", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded px-2.5 py-1 text-sm font-medium",
                view === v ? "bg-secondary" : "text-muted-foreground",
              )}
            >
              {v === "month" ? "Mois" : "Semaine"}
            </button>
          ))}
        </div>
        <Button variant="outline" size="icon" className="size-8" onClick={() => shift(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
          Aujourd&apos;hui
        </Button>
        <Button variant="outline" size="icon" className="size-8" onClick={() => shift(1)}>
          <ChevronRight className="size-4" />
        </Button>
        <span className="text-sm font-semibold capitalize">
          {format(cursor, view === "week" ? "'Semaine du' d MMMM yyyy" : "MMMM yyyy", { locale: fr })}
        </span>

        <div className="ml-auto">
          <EventDialog
            projects={projects}
            members={members}
            trigger={
              <Button size="sm">
                <Plus /> Événement
              </Button>
            }
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-7 border-b bg-secondary/40 text-xs font-medium text-muted-foreground">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="px-2 py-1.5 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className={cn("grid grid-cols-7", view === "week" && "min-h-[60vh]")}>
          {days.map((day) => {
            const dayItems = itemsForDay(day);
            const muted = view === "month" && !isSameMonth(day, cursor);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-24 border-b border-r p-1 last:border-r-0",
                  view === "week" && "min-h-[60vh]",
                  muted && "bg-muted/30",
                )}
              >
                <button
                  onClick={() => setCreateDate(format(day, "yyyy-MM-dd"))}
                  className={cn(
                    "mb-1 flex size-6 items-center justify-center rounded-full text-xs",
                    isToday(day) ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-accent",
                    muted && "text-muted-foreground",
                  )}
                >
                  {format(day, "d")}
                </button>
                <div className="space-y-0.5">
                  {dayItems.slice(0, view === "week" ? 20 : 4).map((i) =>
                    i.kind === "event" ? (
                      <button
                        key={`e${i.id}`}
                        onClick={() => setSelectedEvent(i)}
                        className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px]"
                        style={{ backgroundColor: `${CALENDAR_EVENT[i.type].color}22`, color: CALENDAR_EVENT[i.type].color }}
                      >
                        {!i.allDay ? <span className="tabular-nums">{format(new Date(i.startAt), "HH:mm")}</span> : null}
                        <span className="truncate">{i.title}</span>
                      </button>
                    ) : (
                      <Link
                        key={`d${i.id}`}
                        href={i.href}
                        className="flex w-full items-center gap-1 truncate rounded border-l-2 px-1 py-0.5 text-[11px]"
                        style={{ borderColor: PRIORITY[i.priority].color }}
                      >
                        <span className="font-mono text-muted-foreground">{i.ref}</span>
                        <span className="truncate">{i.title}</span>
                      </Link>
                    ),
                  )}
                  {dayItems.length > (view === "week" ? 20 : 4) ? (
                    <p className="px-1 text-[10px] text-muted-foreground">
                      +{dayItems.length - 4} autres
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent ? (
        <EventDialog
          projects={projects}
          members={members}
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(o) => !o && setSelectedEvent(null)}
        />
      ) : null}

      {createDate ? (
        <EventDialog
          projects={projects}
          members={members}
          defaultDate={createDate}
          open={!!createDate}
          onOpenChange={(o) => !o && setCreateDate(null)}
        />
      ) : null}
    </div>
  );
}
