"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";

export function TaskTimerButton({ taskId, projectId }: { taskId: string; projectId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);

  const { data } = useQuery({
    queryKey: ["time", "current"],
    queryFn: async () => {
      const res = await fetch("/api/time/current");
      if (!res.ok) return null;
      return (await res.json()).data.timer as { taskId: string; startedAt: string } | null;
    },
    refetchInterval: 30_000,
  });

  const runningHere = data?.taskId === taskId;

  React.useEffect(() => {
    if (!runningHere || !data) return;
    const start = new Date(data.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [runningHere, data]);

  async function toggle() {
    setBusy(true);
    try {
      if (runningHere) {
        await fetch("/api/time/stop", { method: "POST" });
        toast.success("Temps enregistré");
      } else {
        const res = await fetch("/api/time/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId }),
        });
        if (!res.ok) throw new Error();
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["time"] }),
        qc.invalidateQueries({ queryKey: ["task", taskId] }),
        qc.invalidateQueries({ queryKey: ["project-board", projectId] }),
      ]);
    } catch {
      toast.error("Action impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={runningHere ? "destructive" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="animate-spin" />
      ) : runningHere ? (
        <Square className="size-3.5" />
      ) : (
        <Play className="size-3.5" />
      )}
      {runningHere ? `Arrêter · ${formatDuration(elapsed)}` : "Démarrer le chrono"}
    </Button>
  );
}
