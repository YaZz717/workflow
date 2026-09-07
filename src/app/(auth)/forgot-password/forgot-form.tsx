"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { requestPasswordResetAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/ui/field";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.ok ? <FormSuccess message={state.message} /> : null}
      {state && !state.ok ? <FormError message={state.error} /> : null}

      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Envoyer le lien
      </Button>
    </form>
  );
}
