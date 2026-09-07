"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Square, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";

type RunningTimer = {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  startedAt: string;
} | null;

async function fetchRunning(): Promise<RunningTimer> {
  const res = await fetch("/api/time/current");
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.timer ?? null;
}

export function RunningTimerBar() {
  const qc = useQueryClient();
  const { data: timer } = useQuery({
    queryKey: ["time", "current"],
    queryFn: fetchRunning,
    refetchInterval: 30_000,
  });

  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (!timer) return;
    const start = new Date(timer.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [timer]);

  if (!timer) return null;

  async function stop() {
    await fetch("/api/time/stop", { method: "POST" });
    qc.invalidateQueries({ queryKey: ["time"] });
  }

  return (
    <div className="flex items-center gap-3 border-b bg-primary/10 px-4 py-2 text-sm">
      <Timer className="size-4 text-primary" />
      <Link
        href={`/projects/${timer.projectId}/tasks/${timer.taskId}`}
        className="truncate font-medium hover:underline"
      >
        {timer.taskTitle}
      </Link>
      <span className="ml-auto font-mono tabular-nums">{formatDuration(elapsed)}</span>
      <Button size="sm" variant="destructive" onClick={stop}>
        <Square className="size-3" /> Stop
      </Button>
    </div>
  );
}
