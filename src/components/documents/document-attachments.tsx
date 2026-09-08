"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Trash2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: { name: string | null };
};

function humanSize(b: number) {
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} Ko`;
  return `${(b / 1024 / 1024).toFixed(1)} Mo`;
}

export function DocumentAttachments({
  documentId,
  attachments,
  canEdit,
}: {
  documentId: string;
  attachments: Attachment[];
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["document", documentId] });
  }

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch(`/api/documents/${documentId}/attachments`, { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) refresh();
    else {
      const j = await res.json().catch(() => null);
      toast.error(j?.error?.message ?? "Échec de l'envoi");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Fichiers ({attachments.length})</p>
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
            <Button size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" /> : <Paperclip className="size-4" />}
              Ajouter
            </Button>
          </>
        ) : null}
      </div>
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun fichier joint.</p>
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
              >
                <Download className="size-4" />
              </a>
              {canEdit ? (
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/attachments/${a.id}`, { method: "DELETE" });
                    if (res.ok) refresh();
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
