"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { resetPasswordAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/ui/field";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <FormSuccess message={state.message} />
        <Button asChild className="w-full">
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state && !state.ok ? <FormError message={state.error} /> : null}

      <Field
        label="Nouveau mot de passe"
        htmlFor="password"
        error={errors?.password?.[0]}
        hint="10 caractères min., une majuscule, une minuscule et un chiffre."
        required
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>

      <Field
        label="Confirmer"
        htmlFor="confirmPassword"
        error={errors?.confirmPassword?.[0]}
        required
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Mettre à jour le mot de passe
      </Button>
    </form>
  );
}
