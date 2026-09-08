"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTask, usePatchTask } from "./use-task";
import { TaskSidebar } from "./sidebar";
import { Subtasks } from "./subtasks";
import { Comments } from "./comments";
import { Attachments } from "./attachments";
import type { ProjectMemberLite } from "../types";

export function TaskDetailView({
  taskId,
  projectId,
  members,
  currentUserId,
  canEdit,
  canManageTags,
  canModerate,
  canDelete,
}: {
  taskId: string;
  projectId: string;
  members: ProjectMemberLite[];
  currentUserId: string;
  canEdit: boolean;
  canManageTags: boolean;
  canModerate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { data: task, isLoading, error } = useTask(taskId);
  const patch = usePatchTask(taskId, projectId);

  const [editingTitle, setEditingTitle] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState("");
  const [descDraft, setDescDraft] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }
  if (error || !task) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Tâche introuvable ou accès refusé.
        </CardContent>
      </Card>
    );
  }

  const totalTimeSec = task.timeEntries.reduce((s, e) => s + e.durationSec, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${projectId}/tasks`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Toutes les tâches
        </Link>
        {canDelete ? (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" /> Supprimer
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {task.project.key}-{task.number}
            </p>
            {editingTitle ? (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                />
                <Button
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={async () => {
                    if (titleDraft.trim() && (await patch({ title: titleDraft.trim() }))) setEditingTitle(false);
                  }}
                >
                  <Check className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" className="size-8 shrink-0" onClick={() => setEditingTitle(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <h1 className="group mt-1 flex items-start gap-2 text-xl font-semibold">
                {task.title}
                {canEdit ? (
                  <button
                    className="mt-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    onClick={() => {
                      setTitleDraft(task.title);
                      setEditingTitle(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </button>
                ) : null}
              </h1>
            )}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Description</span>
              {canEdit && !editingDesc ? (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setDescDraft(task.description ?? "");
                    setEditingDesc(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                </button>
              ) : null}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <Textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} rows={5} autoFocus />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (await patch({ description: descDraft })) setEditingDesc(false);
                    }}
                  >
                    Enregistrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : task.description ? (
              <p className="whitespace-pre-wrap rounded-md border bg-card p-3 text-sm leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Aucune description.
              </p>
            )}
          </div>

          <Card>
            <CardContent className="pt-6">
              <Subtasks taskId={taskId} projectId={projectId} subtasks={task.subtasks} canEdit={canEdit} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Attachments taskId={taskId} projectId={projectId} attachments={task.attachments} canEdit={canEdit} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Comments
                taskId={taskId}
                members={members}
                currentUserId={currentUserId}
                canComment={canEdit}
                canModerate={canModerate}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <TaskSidebar
            task={task}
            members={members}
            canEdit={canEdit}
            canManageTags={canManageTags}
            patch={patch}
            totalTimeSec={totalTimeSec}
          />

          {task.activities.length > 0 ? (
            <Card>
              <CardContent className="space-y-2 pt-6 text-xs text-muted-foreground">
                <p className="text-sm font-medium text-foreground">Historique</p>
                {task.activities.map((a) => (
                  <p key={a.id}>
                    <span className="capitalize">{a.field}</span>
                    {a.oldValue || a.newValue ? (
                      <>
                        {" : "}
                        {a.oldValue ?? "∅"} → {a.newValue ?? "∅"}
                      </>
                    ) : null}{" "}
                    <span className="opacity-60">
                      · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer cette tâche ?"
        description="La tâche, ses sous-tâches, commentaires, pièces jointes et entrées de temps seront supprimés."
        confirmLabel="Supprimer"
        destructive
        onConfirm={async () => {
          const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Tâche supprimée");
            router.push(`/projects/${projectId}/tasks`);
            router.refresh();
          } else {
            toast.error("Échec de la suppression");
          }
        }}
      />
    </div>
  );
}
