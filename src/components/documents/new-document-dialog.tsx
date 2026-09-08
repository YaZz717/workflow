"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, FilePlus } from "lucide-react";
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
import { Field, FormError } from "@/components/ui/field";

export function NewDocumentDialog({
  projects,
  folders,
  fixedProjectId,
  trigger,
}: {
  projects: { id: string; name: string }[];
  folders: { id: string; name: string; projectId: string | null }[];
  fixedProjectId?: string | null;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState(fixedProjectId ?? "");
  const [folderId, setFolderId] = React.useState("");

  const scopedFolders = folders.filter((f) => (f.projectId ?? "") === projectId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          projectId: projectId || null,
          folderId: folderId || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "Échec");
      }
      const { data } = await res.json();
      toast.success("Document créé");
      router.push(`/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <FilePlus /> Nouveau document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau document</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error ? <FormError message={error} /> : null}
          <Field label="Titre" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
          </Field>
          {!fixedProjectId ? (
            <Field label="Périmètre">
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setFolderId("");
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Général (organisation)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    Projet · {p.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {scopedFolders.length > 0 ? (
            <Field label="Dossier">
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Racine</option>
                {scopedFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Créer et ouvrir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
