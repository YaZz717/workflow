"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { changePasswordAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/ui/field";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="max-w-md space-y-4" key={state?.ok ? "done" : "form"}>
      {state?.ok ? <FormSuccess message={state.message} /> : null}
      {state && !state.ok ? <FormError message={state.error} /> : null}

      <Field label="Mot de passe actuel" htmlFor="currentPassword" error={errors?.currentPassword?.[0]} required>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field
        label="Nouveau mot de passe"
        htmlFor="password"
        error={errors?.password?.[0]}
        hint="10 caractères min., une majuscule, une minuscule et un chiffre."
        required
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirmer" htmlFor="confirmPassword" error={errors?.confirmPassword?.[0]} required>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Modifier le mot de passe
      </Button>
    </form>
  );
}
