"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/ui/field";
import { TASK_STATUS, PRIORITY } from "@/lib/constants";
import { AssigneePicker } from "./assignee-picker";
import { TagPicker } from "./tag-picker";
import type { ProjectMemberLite } from "./types";

export function CreateTaskDialog({
  projectId,
  members,
  canManageTags,
  defaultStatus = "BACKLOG",
  trigger,
}: {
  projectId: string;
  members: ProjectMemberLite[];
  canManageTags: boolean;
  defaultStatus?: string;
  trigger?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState(defaultStatus);
  const [priority, setPriority] = React.useState("MEDIUM");
  const [assigneeIds, setAssigneeIds] = React.useState<string[]>([]);
  const [tagIds, setTagIds] = React.useState<string[]>([]);
  const [dueDate, setDueDate] = React.useState("");
  const [estimate, setEstimate] = React.useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setStatus(defaultStatus);
    setPriority("MEDIUM");
    setAssigneeIds([]);
    setTagIds([]);
    setDueDate("");
    setEstimate("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          status,
          priority,
          assigneeIds,
          tagIds,
          dueDate: dueDate || null,
          estimateMinutes: estimate ? Number(estimate) * 60 : null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "Échec de la création");
      }
      toast.success("Tâche créée");
      qc.invalidateQueries({ queryKey: ["project-board", projectId] });
      qc.invalidateQueries({ queryKey: ["project-task-list", projectId] });
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> Nouvelle tâche
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error ? <FormError message={error} /> : null}

          <Field label="Titre" htmlFor="title" required>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Statut">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(TASK_STATUS).map(([v, s]) => (
                  <option key={v} value={v}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priorité">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(PRIORITY).map(([v, p]) => (
                  <option key={v} value={v}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Échéance">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Estimation (heures)">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Assignés">
            <AssigneePicker members={members} value={assigneeIds} onChange={setAssigneeIds} />
          </Field>

          <Field label="Tags">
            <TagPicker value={tagIds} onChange={setTagIds} canCreate={canManageTags} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Créer la tâche
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
