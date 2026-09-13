"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { registerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  if (state?.ok) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-6 text-center">
        <MailCheck className="mx-auto mb-3 size-8 text-success" />
        <p className="font-medium">Compte créé !</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Un email de vérification a été envoyé à <strong>{state.data.email}</strong>. En mode
          développement, le lien s&apos;affiche dans la console du serveur.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <FormError message={state.error} /> : null}

      <Field label="Votre nom" htmlFor="name" error={errors?.name?.[0]} required>
        <Input id="name" name="name" autoComplete="name" placeholder="Camille Ferrand" required />
      </Field>

      <Field
        label="Nom de votre organisation"
        htmlFor="organizationName"
        error={errors?.organizationName?.[0]}
        hint="Vous pourrez inviter votre équipe et ajouter vos clients ensuite."
        required
      >
        <Input id="organizationName" name="organizationName" placeholder="Studio Nova" required />
      </Field>

      <Field label="Email" htmlFor="email" error={errors?.email?.[0]} required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field
        label="Mot de passe"
        htmlFor="password"
        error={errors?.password?.[0]}
        hint="10 caractères min., une majuscule, une minuscule et un chiffre."
        required
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>

      <Field
        label="Confirmer le mot de passe"
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
        Créer mon compte
      </Button>
    </form>
  );
}
