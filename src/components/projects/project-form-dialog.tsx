"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { PROJECT_STATUS, PRIORITY } from "@/lib/constants";
import { createProjectAction, updateProjectAction } from "@/app/(app)/projects/actions";
import type { ActionResult } from "@/lib/actions";

type Member = { id: string; name: string | null; email: string; image: string | null };

type Defaults = {
  name?: string;
  key?: string;
  description?: string | null;
  color?: string;
  priority?: keyof typeof PRIORITY;
  status?: keyof typeof PROJECT_STATUS;
  startDate?: string;
  endDate?: string;
  leadId?: string | null;
  memberIds?: string[];
};

const COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#22c55e"];

export function ProjectFormDialog({
  mode,
  projectId,
  members,
  defaults,
  trigger,
}: {
  mode: "create" | "edit";
  projectId?: string;
  members: Member[];
  defaults?: Defaults;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [color, setColor] = React.useState(defaults?.color ?? COLORS[0]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set(defaults?.memberIds ?? []));

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setFieldErrors({});
    formData.set("color", color);
    if (mode === "create") {
      selected.forEach((id) => formData.append("memberIds", id));
    }

    const res: ActionResult<{ id: string }> | ActionResult =
      mode === "create"
        ? await createProjectAction(null, formData)
        : await updateProjectAction(projectId!, null, formData);

    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Enregistré");
      setOpen(false);
      if (mode === "create" && "data" in res && res.data?.id) {
        router.push(`/projects/${res.data.id}`);
      } else {
        router.refresh();
      }
    } else {
      setError(res.error);
      setFieldErrors(res.fieldErrors ?? {});
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> Nouveau projet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouveau projet" : "Modifier le projet"}</DialogTitle>
        </DialogHeader>

        <form action={onSubmit} className="space-y-4">
          {error ? <FormError message={error} /> : null}

          <Field label="Nom" htmlFor="name" error={fieldErrors.name?.[0]} required>
            <Input id="name" name="name" defaultValue={defaults?.name} required />
          </Field>

          {mode === "create" ? (
            <Field
              label="Clé (optionnel)"
              htmlFor="key"
              hint="Préfixe des tâches, ex. WEB → WEB-1. Généré automatiquement si vide."
              error={fieldErrors.key?.[0]}
            >
              <Input id="key" name="key" placeholder="WEB" maxLength={6} className="uppercase" />
            </Field>
          ) : null}

          <Field label="Description" htmlFor="description" error={fieldErrors.description?.[0]}>
            <Textarea id="description" name="description" rows={3} defaultValue={defaults?.description ?? ""} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Statut" htmlFor="status">
              <select
                id="status"
                name="status"
                defaultValue={defaults?.status ?? "PLANNING"}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(PROJECT_STATUS).map(([v, s]) => (
                  <option key={v} value={v}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priorité" htmlFor="priority">
              <select
                id="priority"
                name="priority"
                defaultValue={defaults?.priority ?? "MEDIUM"}
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
            <Field label="Début" htmlFor="startDate" error={fieldErrors.startDate?.[0]}>
              <Input id="startDate" name="startDate" type="date" defaultValue={defaults?.startDate} />
            </Field>
            <Field label="Fin" htmlFor="endDate" error={fieldErrors.endDate?.[0]}>
              <Input id="endDate" name="endDate" type="date" defaultValue={defaults?.endDate} />
            </Field>
          </div>

          <Field label="Responsable" htmlFor="leadId">
            <select
              id="leadId"
              name="leadId"
              defaultValue={defaults?.leadId ?? ""}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Aucun —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Couleur">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Couleur ${c}`}
                  className="size-7 rounded-full ring-offset-2 ring-offset-card transition-all data-[active=true]:ring-2 data-[active=true]:ring-ring"
                  data-active={color === c}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>

          {mode === "create" ? (
            <Field label="Membres du projet">
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2 scrollbar-thin">
                {members.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(m.id);
                          else next.delete(m.id);
                          return next;
                        });
                      }}
                    />
                    {m.name ?? m.email}
                  </label>
                ))}
              </div>
            </Field>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {mode === "create" ? "Créer le projet" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
