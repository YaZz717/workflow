"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

/**
 * Ajout d'une durée manuelle. `taskId` peut être fixé (page tâche) ou
 * choisi parmi `tasks` (page /time).
 */
export function ManualEntryDialog({
  taskId,
  tasks,
  projectId,
  trigger,
}: {
  taskId?: string;
  tasks?: { id: string; label: string }[];
  projectId?: string;
  trigger?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedTask, setSelectedTask] = React.useState(taskId ?? "");
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = React.useState("1");
  const [minutes, setMinutes] = React.useState("0");
  const [description, setDescription] = React.useState("");
  const [billable, setBillable] = React.useState(true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const totalMin = Math.round(Number(hours) * 60 + Number(minutes));
    if (!selectedTask || totalMin < 1) {
      setError("Choisissez une tâche et une durée valide.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/time/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask,
          date,
          durationMinutes: totalMin,
          description,
          billable,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "Échec de l'enregistrement");
      }
      toast.success("Temps ajouté");
      qc.invalidateQueries({ queryKey: ["time"] });
      if (taskId) qc.invalidateQueries({ queryKey: ["task", taskId] });
      if (projectId) qc.invalidateQueries({ queryKey: ["project-board", projectId] });
      setOpen(false);
      setDescription("");
      setHours("1");
      setMinutes("0");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Plus /> Saisie manuelle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter du temps</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error ? <FormError message={error} /> : null}

          {tasks ? (
            <Field label="Tâche" required>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Choisir…</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label="Date" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Heures">
              <Input type="number" min={0} max={24} value={hours} onChange={(e) => setHours(e.target.value)} />
            </Field>
            <Field label="Minutes">
              <Input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </Field>
          </div>

          <Field label="Description (optionnel)">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
            Temps facturable au client
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
