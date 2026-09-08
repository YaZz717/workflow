"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Eye, Pencil, Save, Trash2, Archive, ArchiveRestore, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Markdown } from "./markdown";
import { DocumentAttachments } from "./document-attachments";

type DocData = {
  id: string;
  title: string;
  content: string;
  isArchived: boolean;
  updatedAt: string;
  author: { id: string; name: string | null; image: string | null };
  project: { id: string; key: string; name: string } | null;
  folder: { id: string; name: string } | null;
  attachments: Parameters<typeof DocumentAttachments>[0]["attachments"];
};

export function DocumentEditor({
  documentId,
  currentUserId,
  isManager,
  backHref,
}: {
  documentId: string;
  currentUserId: string;
  isManager: boolean;
  backHref: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async (): Promise<DocData> => {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error("introuvable");
      return (await res.json()).data.document;
    },
  });

  const [mode, setMode] = React.useState<"read" | "edit">("read");
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Brouillon local, resynchronisé quand la version serveur change (pattern « clé »).
  const [draft, setDraft] = React.useState<{ src: string | undefined; title: string; content: string }>(
    { src: undefined, title: "", content: "" },
  );
  const serverKey = doc ? `${doc.id}:${doc.updatedAt}` : undefined;
  if (doc && serverKey !== draft.src) {
    setDraft({ src: serverKey, title: doc.title, content: doc.content });
  }
  const { title, content } = draft;
  const setTitle = (v: string) => setDraft((d) => ({ ...d, title: v }));
  const setContent = (v: string) => setDraft((d) => ({ ...d, content: v }));

  if (isLoading || !doc) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }

  const canEdit = !doc.isArchived;
  const canDelete = doc.author.id === currentUserId || isManager;
  const dirty = title !== doc.title || content !== doc.content;

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() || "Sans titre", content }),
    });
    setSaving(false);
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ["document", documentId] });
      qc.invalidateQueries({ queryKey: ["documents"] });
      setSavedAt(Date.now());
      setMode("read");
    } else toast.error("Échec de l'enregistrement");
  }

  async function toggleArchive() {
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !doc!.isArchived }),
    });
    if (res.ok) {
      toast.success(doc!.isArchived ? "Document restauré" : "Document archivé");
      qc.invalidateQueries({ queryKey: ["document", documentId] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    } else toast.error("Échec");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Documents
        </Link>
        <div className="flex items-center gap-2">
          {savedAt && mode === "read" ? (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <Check className="size-3.5" /> Enregistré
            </span>
          ) : null}
          {canEdit ? (
            mode === "read" ? (
              <Button size="sm" variant="outline" onClick={() => setMode("edit")}>
                <Pencil className="size-4" /> Modifier
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setMode("read");
                    setDraft({ src: serverKey, title: doc.title, content: doc.content });
                  }}
                >
                  Annuler
                </Button>
                <Button size="sm" onClick={save} disabled={saving || !dirty}>
                  {saving ? <Loader2 className="animate-spin" /> : <Save className="size-4" />} Enregistrer
                </Button>
              </>
            )
          ) : null}
          {canDelete ? (
            <>
              <Button size="sm" variant="ghost" onClick={toggleArchive}>
                {doc.isArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {doc.project ? (
          <Link href={`/projects/${doc.project.id}/documents`} className="hover:underline">
            {doc.project.name}
          </Link>
        ) : (
          <span>Général</span>
        )}
        {doc.folder ? <span>· {doc.folder.name}</span> : null}
        <span>· maj {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true, locale: fr })}</span>
        <span className="inline-flex items-center gap-1">
          · <UserAvatar name={doc.author.name} image={doc.author.image} className="size-4" /> {doc.author.name}
        </span>
        {doc.isArchived ? (
          <span className="rounded bg-warning/10 px-1.5 py-0.5 font-medium text-warning">Archivé</span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Card>
          <CardContent className="pt-6">
            {mode === "edit" ? (
              <div className="space-y-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="Titre du document"
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="size-3.5" /> Markdown pris en charge (titres, listes, tableaux, code…)
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="font-mono text-xs"
                  placeholder={"# Titre\n\nVotre contenu…"}
                />
              </div>
            ) : (
              <>
                <h1 className="mb-3 text-2xl font-semibold">{doc.title}</h1>
                <Markdown>{doc.content}</Markdown>
              </>
            )}
          </CardContent>
        </Card>

        <div className={cn(mode === "edit" && "lg:sticky lg:top-20 lg:self-start")}>
          {mode === "edit" ? (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <p className="mb-2 text-sm font-medium">Aperçu</p>
                <div className="max-h-80 overflow-y-auto scrollbar-thin rounded-md border p-3">
                  <Markdown>{content}</Markdown>
                </div>
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardContent className="pt-6">
              <DocumentAttachments
                documentId={documentId}
                attachments={doc.attachments}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Supprimer « ${doc.title} » ?`}
        description="Le document et ses fichiers joints seront définitivement supprimés."
        confirmLabel="Supprimer"
        destructive
        onConfirm={async () => {
          const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Document supprimé");
            router.push(backHref);
            router.refresh();
          } else toast.error("Échec");
        }}
      />
    </div>
  );
}
