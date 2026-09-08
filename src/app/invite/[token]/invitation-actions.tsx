"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/field";
import { acceptInvitationAction, declineInvitationAction } from "./actions";

export function InvitationActions({
  token,
  emailMismatch,
  invitedEmail,
}: {
  token: string;
  emailMismatch: boolean;
  invitedEmail: string;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  if (emailMismatch) {
    return (
      <FormError
        message={`Vous êtes connecté avec un autre compte. Cette invitation est destinée à ${invitedEmail}.`}
      />
    );
  }

  function accept() {
    start(async () => {
      const res = await acceptInvitationAction(token);
      if (res && !res.ok) setMsg({ ok: false, text: res.error });
      // en cas de succès, l'action redirige vers /dashboard
    });
  }

  function decline() {
    start(async () => {
      const res = await declineInvitationAction(token);
      setMsg({ ok: res.ok, text: res.ok ? "Invitation déclinée." : res.error });
      if (res.ok) setTimeout(() => router.push("/dashboard"), 1200);
    });
  }

  return (
    <div className="space-y-3">
      {msg ? (msg.ok ? <FormSuccess message={msg.text} /> : <FormError message={msg.text} />) : null}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={accept} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Accepter
        </Button>
        <Button variant="outline" className="flex-1" onClick={decline} disabled={pending}>
          Décliner
        </Button>
      </div>
    </div>
  );
}
