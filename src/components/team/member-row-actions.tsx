"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ORG_ROLE_LABEL } from "@/lib/constants";
import { removeMemberAction, updateMemberRoleAction } from "@/app/(app)/team/actions";

const ASSIGNABLE = ["ADMIN", "MANAGER", "MEMBER", "GUEST"] as const;

export function MemberRowActions({
  userId,
  userName,
  currentRole,
  canChangeRole,
  canRemove,
}: {
  userId: string;
  userName: string;
  currentRole: string;
  canChangeRole: boolean;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  if (!canChangeRole && !canRemove) return null;

  function setRole(role: string) {
    start(async () => {
      const fd = new FormData();
      fd.set("userId", userId);
      fd.set("role", role);
      const res = await updateMemberRoleAction(null, fd);
      if (res.ok) {
        toast.success(res.message ?? "Rôle mis à jour");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" disabled={pending}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canChangeRole ? (
            <>
              <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
              {ASSIGNABLE.map((r) => (
                <DropdownMenuItem
                  key={r}
                  disabled={r === currentRole}
                  onClick={() => setRole(r)}
                >
                  {ORG_ROLE_LABEL[r]}
                  {r === currentRole ? " ✓" : ""}
                </DropdownMenuItem>
              ))}
            </>
          ) : null}
          {canRemove ? (
            <>
              {canChangeRole ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmRemove(true)}
              >
                Retirer de l&apos;organisation
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={`Retirer ${userName} ?`}
        description="La personne perd l'accès à cette organisation et à tous ses projets. Ses affectations de tâches sont retirées."
        confirmLabel="Retirer"
        destructive
        onConfirm={async () => {
          const res = await removeMemberAction(userId);
          if (res.ok) {
            toast.success(res.message ?? "Membre retiré");
            router.refresh();
          } else toast.error(res.error);
        }}
      />
    </>
  );
}
