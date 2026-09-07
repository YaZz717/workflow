"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TASK_STATUS } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import type { TaskStatus } from "@prisma/client";

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

export function CompletionTrendChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" {...axisProps} interval={1} />
        <YAxis allowDecimals={false} {...axisProps} width={30} />
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Terminées"
          stroke="var(--color-primary)"
          fill="url(#fillCount)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TasksByStatusChart({
  data,
}: {
  data: { status: TaskStatus; count: number }[];
}) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ name: TASK_STATUS[d.status].label, value: d.count, color: TASK_STATUS[d.status].color }));

  if (chartData.length === 0)
    return <p className="py-16 text-center text-sm text-muted-foreground">Aucune tâche.</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TimePerProjectChart({
  data,
}: {
  data: { name: string; color: string; seconds: number }[];
}) {
  if (data.length === 0)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Aucun temps enregistré cette semaine.
      </p>
    );

  const chartData = data.map((d) => ({ ...d, hours: +(d.seconds / 3600).toFixed(2) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 16 }}>
        <XAxis type="number" {...axisProps} unit="h" />
        <YAxis type="category" dataKey="name" width={110} {...axisProps} />
        <Tooltip
          formatter={(v) => formatDuration(Math.round(Number(v) * 3600))}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
