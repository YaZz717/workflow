"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Pencil, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/avatar";
import { useTaskComments, type TaskComment } from "./use-task";
import type { ProjectMemberLite } from "../types";

function renderBody(body: string, members: ProjectMemberLite[]) {
  const names = members
    .map((m) => m.name)
    .filter(Boolean)
    .flatMap((n) => [n as string, (n as string).split(/\s+/)[0]]);
  const pattern = names.length
    ? new RegExp(`(@(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}))\\b`, "gi")
    : null;
  if (!pattern) return body;
  return body.split(pattern).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-primary">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

export function Comments({
  taskId,
  members,
  currentUserId,
  canComment,
  canModerate,
}: {
  taskId: string;
  members: ProjectMemberLite[];
  currentUserId: string;
  canComment: boolean;
  canModerate: boolean;
}) {
  const { data: comments = [], isLoading } = useTaskComments(taskId);
  const qc = useQueryClient();
  const [body, setBody] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editBody, setEditBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["task-comments", taskId] });
    qc.invalidateQueries({ queryKey: ["task", taskId] });
    qc.invalidateQueries({ queryKey: ["project-board"] });
  }

  function onBodyChange(v: string) {
    setBody(v);
    const m = v.slice(0, taRef.current?.selectionStart ?? v.length).match(/@(\w*)$/);
    setMentionQuery(m ? m[1] : null);
  }

  function insertMention(name: string) {
    setBody((prev) => prev.replace(/@(\w*)$/, `@${name} `));
    setMentionQuery(null);
    taRef.current?.focus();
  }

  const mentionMatches =
    mentionQuery !== null
      ? members.filter((m) => (m.name ?? "").toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
      : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), parentId: replyTo }),
    });
    setBusy(false);
    if (res.ok) {
      setBody("");
      setReplyTo(null);
      refresh();
    } else toast.error("Échec de l'envoi");
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editBody.trim() }),
    });
    if (res.ok) {
      setEditing(null);
      refresh();
    } else toast.error("Échec");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  function CommentItem({ c, nested }: { c: TaskComment; nested?: boolean }) {
    const mine = c.author.id === currentUserId;
    return (
      <div className={cn("flex gap-3", nested && "ml-8")}>
        <UserAvatar name={c.author.name} image={c.author.image} className="size-7 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{c.author.name}</span>{" "}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: fr })}
              {c.editedAt ? " · modifié" : ""}
            </span>
          </p>
          {editing === c.id ? (
            <div className="mt-1 space-y-2">
              <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit(c.id)}>
                  Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground/90">
              {renderBody(c.body, members)}
            </p>
          )}
          {editing !== c.id ? (
            <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
              {canComment && !nested ? (
                <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setReplyTo(c.id)}>
                  <Reply className="size-3" /> Répondre
                </button>
              ) : null}
              {mine ? (
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => {
                    setEditing(c.id);
                    setEditBody(c.body);
                  }}
                >
                  <Pencil className="size-3" /> Modifier
                </button>
              ) : null}
              {mine || canModerate ? (
                <button className="inline-flex items-center gap-1 hover:text-destructive" onClick={() => remove(c.id)}>
                  <Trash2 className="size-3" /> Supprimer
                </button>
              ) : null}
            </div>
          ) : null}

          {repliesOf(c.id).map((r) => (
            <div key={r.id} className="mt-3">
              <CommentItem c={r} nested />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Commentaires ({comments.length})</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : roots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun commentaire pour l&apos;instant.</p>
      ) : (
        <div className="space-y-4">
          {roots.map((c) => (
            <CommentItem key={c.id} c={c} />
          ))}
        </div>
      )}

      {canComment ? (
        <form onSubmit={submit} className="relative space-y-2 border-t pt-3">
          {replyTo ? (
            <p className="text-xs text-muted-foreground">
              Réponse à un commentaire ·{" "}
              <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                annuler
              </button>
            </p>
          ) : null}
          <Textarea
            ref={taRef}
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder="Écrire un commentaire… (tapez @ pour mentionner)"
            rows={3}
          />
          {mentionMatches.length > 0 ? (
            <div className="absolute z-10 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
              {mentionMatches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => insertMention((m.name ?? "").split(/\s+/)[0])}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <UserAvatar name={m.name} image={m.image} className="size-5" />
                  {m.name}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={busy || !body.trim()}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              Commenter
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
