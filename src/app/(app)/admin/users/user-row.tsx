"use client";

import { useActionState } from "react";
import { toast } from "sonner";

import { setGlobalRoleAction, toggleUserActiveAction } from "../actions";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function AdminUserRow({
  userId,
  globalRole,
  isActive,
}: {
  userId: string;
  globalRole: "USER" | "ADMIN";
  isActive: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(setGlobalRoleAction, null);
  const [activeState, activeAction, activePending] = useActionState(toggleUserActiveAction, null);

  useEffect(() => {
    const s = roleState ?? activeState;
    if (!s) return;
    if (s.ok) toast.success(s.message ?? "Fait");
    else toast.error(s.error);
  }, [roleState, activeState]);

  return (
    <div className="flex gap-2">
      <form action={roleAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="role" value={globalRole === "ADMIN" ? "USER" : "ADMIN"} />
        <Button type="submit" size="sm" variant="outline" disabled={rolePending}>
          {globalRole === "ADMIN" ? "Retirer admin" : "Passer admin"}
        </Button>
      </form>
      <form action={activeAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="active" value={isActive ? "false" : "true"} />
        <Button
          type="submit"
          size="sm"
          variant={isActive ? "destructive" : "secondary"}
          disabled={activePending}
        >
          {isActive ? "Désactiver" : "Réactiver"}
        </Button>
      </form>
    </div>
  );
}
