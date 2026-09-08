"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CALENDAR_EVENT } from "@/lib/constants";
import type { CalendarEventItem } from "./types";

type Member = { id: string; name: string | null; email: string };
type Project = { id: string; name: string };

export function EventDialog({
  projects,
  members,
  defaultDate,
  event,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  projects: Project[];
  members: Member[];
  defaultDate?: string;
  event?: CalendarEventItem;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const isEdit = !!event;
  const d0 = defaultDate ?? format(new Date(), "yyyy-MM-dd");

  const [title, setTitle] = React.useState(event?.title ?? "");
  const [description, setDescription] = React.useState(event?.description ?? "");
  const [type, setType] = React.useState(event?.type ?? "MEETING");
  const [date, setDate] = React.useState(
    event ? format(new Date(event.startAt), "yyyy-MM-dd") : d0,
  );
  const [start, setStart] = React.useState(
    event ? format(new Date(event.startAt), "HH:mm") : "10:00",
  );
  const [end, setEnd] = React.useState(event ? format(new Date(event.endAt), "HH:mm") : "11:00");
  const [allDay, setAllDay] = React.useState(event?.allDay ?? false);
  const [location, setLocation] = React.useState(event?.location ?? "");
  const [projectId, setProjectId] = React.useState(event?.project?.id ?? "");
  const [attendeeIds, setAttendeeIds] = React.useState<string[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setPending(true);
    setError(null);
    const startAt = allDay ? `${date}T00:00:00` : `${date}T${start}:00`;
    const endAt = allDay ? `${date}T23:59:00` : `${date}T${end}:00`;
    const body = {
      title: title.trim(),
      description,
      type,
      startAt,
      endAt,
      allDay,
      location,
      projectId: projectId || null,
      attendeeIds,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/calendar/events/${event!.id}` : "/api/calendar/events",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "Échec");
      }
      toast.success(isEdit ? "Événement modifié" : "Événement créé");
      qc.invalidateQueries({ queryKey: ["calendar"] });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    const res = await fetch(`/api/calendar/events/${event!.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Événement supprimé");
      qc.invalidateQueries({ queryKey: ["calendar"] });
      setOpen(false);
    } else toast.error("Échec");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error ? <FormError message={error} /> : null}

          <Field label="Titre" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(CALENDAR_EVENT).map(([v, m]) => (
                  <option key={v} value={v}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Projet (optionnel)">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Aucun</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Date" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            Toute la journée
          </label>

          {!allDay ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Début">
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </Field>
              <Field label="Fin">
                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </Field>
            </div>
          ) : null}

          <Field label="Lieu (optionnel)">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>

          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </Field>

          <Field label="Participants">
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2 scrollbar-thin">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={attendeeIds.includes(m.id)}
                    onChange={(e) =>
                      setAttendeeIds((prev) =>
                        e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id),
                      )
                    }
                  />
                  {m.name ?? m.email}
                </label>
              ))}
            </div>
          </Field>

          <DialogFooter className="items-center">
            {isEdit && event!.canManage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mr-auto text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" /> Supprimer
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : isEdit ? null : <Plus />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Supprimer cet événement ?"
          confirmLabel="Supprimer"
          destructive
          onConfirm={remove}
        />
      </DialogContent>
    </Dialog>
  );
}
