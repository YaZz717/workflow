"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { startCheckoutAction, openBillingPortalAction } from "@/app/(app)/settings/actions";

export function BillingActions({
  plan,
  hasStripeCustomer,
  billingConfigured,
}: {
  plan: string;
  hasStripeCustomer: boolean;
  billingConfigured: boolean;
}) {
  const [pending, setPending] = React.useState(false);

  if (!billingConfigured) {
    return (
      <p className="text-xs text-muted-foreground">
        Facturation non configurée pour le moment.
      </p>
    );
  }

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    const res = await action();
    // En cas de succès, l'action redirige vers Stripe et ne revient jamais ici.
    if (!res.ok) toast.error(res.error);
    setPending(false);
  }

  if (plan === "FREE") {
    return (
      <Button size="sm" disabled={pending} onClick={() => run(startCheckoutAction)}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Passer en Pro
      </Button>
    );
  }

  if (hasStripeCustomer) {
    return (
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(openBillingPortalAction)}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Gérer mon abonnement
      </Button>
    );
  }

  return null;
}
