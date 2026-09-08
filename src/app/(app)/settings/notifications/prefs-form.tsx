"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { NotificationType } from "@prisma/client";

import { updateNotificationPrefsAction } from "../actions";
import { CONFIGURABLE_TYPES } from "@/lib/notification-prefs";
import { Button } from "@/components/ui/button";
import { FormSuccess, FormError } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

export function NotificationPrefsForm({
  defaults,
}: {
  defaults: Record<NotificationType, { inApp: boolean }>;
}) {
  const [state, formAction, pending] = useActionState(updateNotificationPrefsAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.ok ? <FormSuccess message={state.message} /> : null}
      {state && !state.ok ? <FormError message={state.error} /> : null}

      <ul className="divide-y">
        {CONFIGURABLE_TYPES.map(({ type, label, description }) => (
          <li key={type} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch name={`pref_${type}`} defaultChecked={defaults[type]?.inApp ?? true} />
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Ces réglages contrôlent les notifications affichées dans l&apos;application. L&apos;envoi
        d&apos;emails de notification n&apos;est pas activé dans cette version.
      </p>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Enregistrer
      </Button>
    </form>
  );
}
