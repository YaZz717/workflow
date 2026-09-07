"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <FormError message={state.error} /> : null}

      <Field label="Email" htmlFor="email" error={errors?.email?.[0]} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          required
        />
      </Field>

      <Field label="Mot de passe" htmlFor="password" error={errors?.password?.[0]} required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Se connecter
      </Button>
    </form>
  );
}
