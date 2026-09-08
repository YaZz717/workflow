"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Folder, Search, Trash2, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NewDocumentDialog } from "./new-document-dialog";
import { NewFolderDialog } from "./new-folder-dialog";

type DocItem = {
  id: string;
  title: string;
  updatedAt: string;
  isArchived: boolean;
  projectId: string | null;
  folderId: string | null;
  author: { id: string; name: string | null; image: string | null };
  project: { id: string; key: string; name: string; color: string } | null;
  folder: { id: string; name: string } | null;
  _count: { attachments: number };
};
type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  projectId: string | null;
  _count: { documents: number; children: number };
};
type ProjectItem = { id: string; name: string; key: string; color: string };

export function DocumentBrowser({ fixedProjectId }: { fixedProjectId?: string }) {
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [dq, setDq] = React.useState("");
  const [scope, setScope] = React.useState<string>(fixedProjectId ? "project" : "all");
  const [folderId, setFolderId] = React.useState("");
  const [archived, setArchived] = React.useState(false);
  const [deleteFolderId, setDeleteFolderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams();
  if (fixedProjectId) params.set("projectId", fixedProjectId);
  else if (scope === "general") params.set("scope", "general");
  if (folderId) params.set("folderId", folderId);
  if (dq) params.set("q", dq);
  if (archived) params.set("archived", "1");

  const { data, isLoading } = useQuery({
    queryKey: ["documents", params.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) throw new Error();
      return (await res.json()).data as {
        documents: DocItem[];
        folders: FolderItem[];
        projects: ProjectItem[];
      };
    },
  });

  const projects = data?.projects ?? [];
  const folders = (data?.folders ?? []).filter((f) =>
    fixedProjectId ? f.projectId === fixedProjectId : scope === "general" ? f.projectId === null : true,
  );
  const docs = data?.documents ?? [];

  async function deleteFolder(id: string) {
    const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Dossier supprimé");
      if (folderId === id) setFolderId("");
      qc.invalidateQueries({ queryKey: ["documents"] });
    } else toast.error("Échec");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {!fixedProjectId ? (
          <div className="flex rounded-md border p-0.5">
            {[
              { v: "all", l: "Tous" },
              { v: "general", l: "Général" },
            ].map((s) => (
              <button
                key={s.v}
                onClick={() => {
                  setScope(s.v);
                  setFolderId("");
                }}
                className={cn(
                  "rounded px-2.5 py-1 text-sm font-medium",
                  scope === s.v ? "bg-secondary" : "text-muted-foreground",
                )}
              >
                {s.l}
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-52 pl-8" />
        </div>

        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          Archivés
        </label>

        <div className="ml-auto flex gap-2">
          <NewFolderDialog projectId={fixedProjectId ?? null} />
          <NewDocumentDialog
            projects={projects}
            folders={(data?.folders ?? []).map((f) => ({ id: f.id, name: f.name, projectId: f.projectId }))}
            fixedProjectId={fixedProjectId ?? null}
          />
        </div>
      </div>

      {folders.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFolderId("")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              folderId === "" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
            )}
          >
            Tous
          </button>
          {folders.map((f) => (
            <span
              key={f.id}
              className={cn(
                "group inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
                folderId === f.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <button onClick={() => setFolderId(f.id)} className="inline-flex items-center gap-1">
                <Folder className="size-3.5" />
                {f.name} ({f._count.documents})
              </button>
              <button
                onClick={() => setDeleteFolderId(f.id)}
                className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Aucun document"
          description="Créez un document pour partager des informations avec l'équipe."
        />
      ) : (
        <Card className="divide-y">
          {docs.map((d) => (
            <Link
              key={d.id}
              href={`/documents/${d.id}`}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {d.title}
                  {d.isArchived ? (
                    <span className="ml-2 rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                      archivé
                    </span>
                  ) : null}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {d.project ? (
                    <>
                      <span className="size-2 rounded-full" style={{ background: d.project.color }} />
                      {d.project.name}
                    </>
                  ) : (
                    "Général"
                  )}
                  {d.folder ? ` · ${d.folder.name}` : ""}
                  {" · "}
                  {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
              {d._count.attachments > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="size-3.5" />
                  {d._count.attachments}
                </span>
              ) : null}
              <UserAvatar name={d.author.name} image={d.author.image} className="size-6" />
            </Link>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteFolderId}
        onOpenChange={(o) => !o && setDeleteFolderId(null)}
        title="Supprimer ce dossier ?"
        description="Les documents qu'il contient ne sont pas supprimés : ils sont déplacés à la racine."
        confirmLabel="Supprimer le dossier"
        destructive
        onConfirm={async () => {
          if (deleteFolderId) await deleteFolder(deleteFolderId);
          setDeleteFolderId(null);
        }}
      />
    </div>
  );
}
