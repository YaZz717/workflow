"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { revokeInvitationAction } from "@/app/(app)/team/actions";

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground hover:text-destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await revokeInvitationAction(invitationId);
          if (res.ok) {
            toast.success("Invitation révoquée");
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      <X className="size-4" /> Révoquer
    </Button>
  );
}
