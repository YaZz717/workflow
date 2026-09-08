"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDuration } from "@/lib/utils";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};
const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

export function DailyHoursChart({ data }: { data: { date: string; hours: number }[] }) {
  const chart = data.map((d) => ({ ...d, label: d.date.slice(8) + "/" + d.date.slice(5, 7) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" {...axis} interval={1} />
        <YAxis {...axis} width={30} unit="h" />
        <Tooltip
          formatter={(v) => formatDuration(Math.round(Number(v) * 3600))}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="hours" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BreakdownBar({
  data,
}: {
  data: { id: string; name?: string; color?: string; seconds: number }[];
}) {
  if (data.length === 0)
    return <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée sur la période.</p>;

  const chart = data.map((d) => ({ ...d, hours: +(d.seconds / 3600).toFixed(2) }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, chart.length * 34)}>
      <BarChart data={chart} layout="vertical" margin={{ left: 10, right: 16 }}>
        <XAxis type="number" {...axis} unit="h" />
        <YAxis type="category" dataKey="name" width={150} {...axis} />
        <Tooltip
          formatter={(v) => formatDuration(Math.round(Number(v) * 3600))}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
          {chart.map((d, i) => (
            <Cell key={i} fill={d.color ?? "var(--color-primary)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
