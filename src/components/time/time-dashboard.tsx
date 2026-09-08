"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, CalendarDays, CalendarRange } from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ManualEntryDialog } from "./manual-entry-dialog";
import { TimeEntriesTable } from "./time-entries-table";
import { DailyHoursChart, BreakdownBar } from "./time-charts";

const RANGES = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
] as const;

type Stats = {
  totals: { todaySec: number; weekSec: number; monthSec: number; rangeSec: number };
  byProject: { id: string; name?: string; color?: string; seconds: number }[];
  byUser: { id: string; name?: string; seconds: number }[];
  byTask: { id: string; name?: string; seconds: number }[];
  daily: { date: string; hours: number }[];
};

export function TimeDashboard({
  isManager,
  projects,
  taskOptions,
}: {
  isManager: boolean;
  projects: { id: string; name: string }[];
  taskOptions: { id: string; label: string }[];
}) {
  const [range, setRange] = React.useState<"today" | "week" | "month">("week");
  const [scope, setScope] = React.useState<"me" | "team">("me");
  const [projectId, setProjectId] = React.useState("");
  const [page, setPage] = React.useState(1);

  const stats = useQuery({
    queryKey: ["time", "stats", range, scope],
    queryFn: async (): Promise<Stats> => {
      const res = await fetch(`/api/time/stats?range=${range}&scope=${scope}`);
      return (await res.json()).data;
    },
  });

  const entryParams = new URLSearchParams({ page: String(page) });
  if (projectId) entryParams.set("projectId", projectId);
  if (scope === "team" && isManager) entryParams.set("userId", "");

  const entries = useQuery({
    queryKey: ["time", "entries", entryParams.toString(), scope],
    queryFn: async () => {
      const res = await fetch(`/api/time/entries?${entryParams.toString()}`);
      return (await res.json()).data as {
        items: Parameters<typeof TimeEntriesTable>[0]["entries"];
        pagination: { page: number; totalPages: number; total: number };
        totalSec: number;
      };
    },
  });

  const s = stats.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded px-2.5 py-1 text-sm font-medium",
                range === r.value ? "bg-secondary" : "text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {isManager ? (
          <div className="flex rounded-md border p-0.5">
            {(["me", "team"] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => {
                  setScope(sc);
                  setPage(1);
                }}
                className={cn(
                  "rounded px-2.5 py-1 text-sm font-medium",
                  scope === sc ? "bg-secondary" : "text-muted-foreground",
                )}
              >
                {sc === "me" ? "Moi" : "Équipe"}
              </button>
            ))}
          </div>
        ) : null}

        <select
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Tous les projets</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="ml-auto">
          <ManualEntryDialog tasks={taskOptions} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aujourd'hui" value={formatDuration(s?.totals.todaySec ?? 0)} icon={Clock} />
        <StatCard label="Cette semaine" value={formatDuration(s?.totals.weekSec ?? 0)} icon={CalendarDays} />
        <StatCard label="Ce mois" value={formatDuration(s?.totals.monthSec ?? 0)} icon={CalendarRange} />
        <StatCard
          label={`Période (${RANGES.find((r) => r.value === range)?.label})`}
          value={formatDuration(s?.totals.rangeSec ?? 0)}
          icon={Clock}
          accent="success"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temps par jour — 14 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>{s ? <DailyHoursChart data={s.daily} /> : <Skeleton />}</CardContent>
      </Card>

      <div className={cn("grid gap-4", scope === "team" ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        <Card>
          <CardHeader>
            <CardTitle>Par projet</CardTitle>
          </CardHeader>
          <CardContent>{s ? <BreakdownBar data={s.byProject} /> : <Skeleton />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Par tâche</CardTitle>
          </CardHeader>
          <CardContent>{s ? <BreakdownBar data={s.byTask} /> : <Skeleton />}</CardContent>
        </Card>
        {scope === "team" ? (
          <Card>
            <CardHeader>
              <CardTitle>Par personne</CardTitle>
            </CardHeader>
            <CardContent>{s ? <BreakdownBar data={s.byUser} /> : <Skeleton />}</CardContent>
          </Card>
        ) : null}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Historique des entrées</h2>
        {entries.data ? (
          <TimeEntriesTable
            entries={entries.data.items}
            pagination={entries.data.pagination}
            totalSec={entries.data.totalSec}
            onPage={setPage}
            showUser={scope === "team"}
          />
        ) : (
          <Skeleton />
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="h-40 animate-pulse rounded-md bg-muted" />;
}
