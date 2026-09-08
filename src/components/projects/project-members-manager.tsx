"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  addProjectMemberAction,
  removeProjectMemberAction,
  updateProjectMemberRoleAction,
} from "@/app/(app)/projects/actions";

const ROLE_LABEL: Record<string, string> = { LEAD: "Responsable", MEMBER: "Membre", VIEWER: "Observateur" };
type PickUser = { id: string; name: string | null; email: string; image: string | null };

export function ProjectMembersManager({
  projectId,
  leadId,
  canManage,
  members,
  addable,
}: {
  projectId: string;
  leadId: string | null;
  canManage: boolean;
  members: { userId: string; role: string; name: string | null; email: string; image: string | null }[];
  addable: PickUser[];
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [addUserId, setAddUserId] = React.useState("");
  const [addRole, setAddRole] = React.useState("MEMBER");
  const [toRemove, setToRemove] = React.useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message ?? "Fait");
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  }

  return (
    <div className="space-y-6">
      {canManage && addable.length > 0 ? (
        <form
          className="flex flex-wrap items-end gap-2 rounded-md border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!addUserId) return;
            const fd = new FormData();
            fd.set("userId", addUserId);
            fd.set("role", addRole);
            run(() => addProjectMemberAction(projectId, null, fd));
            setAddUserId("");
          }}
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Ajouter un membre</label>
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Choisir une personne…</option>
              {addable.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </div>
          <select
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="MEMBER">Membre</option>
            <option value="LEAD">Responsable</option>
            <option value="VIEWER">Observateur</option>
          </select>
          <Button type="submit" disabled={pending || !addUserId}>
            {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Ajouter
          </Button>
        </form>
      ) : null}

      <ul className="divide-y">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center gap-3 py-3">
            <UserAvatar name={m.name} image={m.image} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{m.name}</p>
              <p className="truncate text-xs text-muted-foreground">{m.email}</p>
            </div>

            {canManage ? (
              <select
                value={m.role}
                onChange={(e) =>
                  run(() =>
                    updateProjectMemberRoleAction(
                      projectId,
                      m.userId,
                      e.target.value as "LEAD" | "MEMBER" | "VIEWER",
                    ),
                  )
                }
                disabled={pending}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="LEAD">Responsable</option>
                <option value="MEMBER">Membre</option>
                <option value="VIEWER">Observateur</option>
              </select>
            ) : (
              <Badge variant="secondary">{ROLE_LABEL[m.role]}</Badge>
            )}

            {canManage && m.userId !== leadId ? (
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => setToRemove(m.userId)}
                disabled={pending}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title="Retirer ce membre du projet ?"
        description="Ses affectations de tâches dans ce projet seront supprimées."
        confirmLabel="Retirer"
        destructive
        onConfirm={async () => {
          if (!toRemove) return;
          const res = await removeProjectMemberAction(projectId, toRemove);
          if (res.ok) {
            toast.success(res.message ?? "Retiré");
            router.refresh();
          } else {
            toast.error(res.error);
          }
          setToRemove(null);
        }}
      />
    </div>
  );
}
