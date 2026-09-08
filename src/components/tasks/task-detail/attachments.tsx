"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Trash2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { TaskDetail } from "./use-task";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function Attachments({
  taskId,
  projectId,
  attachments,
  canEdit,
}: {
  taskId: string;
  projectId: string;
  attachments: TaskDetail["attachments"];
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["task", taskId] });
    qc.invalidateQueries({ queryKey: ["project-board", projectId] });
  }

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch(`/api/tasks/${taskId}/attachments`, { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) refresh();
    else {
      const j = await res.json().catch(() => null);
      toast.error(j?.error?.message ?? "Échec de l'envoi");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove(id: string) {
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Pièces jointes ({attachments.length})</p>
        {canEdit ? (
          <>
            <input
              ref={inputRef}
              type="file"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Paperclip className="size-4" />}
              Joindre un fichier
            </Button>
          </>
        ) : null}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune pièce jointe.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {humanSize(a.sizeBytes)} · {a.uploadedBy.name}
                </p>
              </div>
              <a
                href={`/api/attachments/${a.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
                title="Ouvrir"
              >
                <Download className="size-4" />
              </a>
              {canEdit ? (
                <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Types autorisés : images, PDF, texte, archives, documents Office. Taille max 10 Mo.
      </p>
    </div>
  );
}
