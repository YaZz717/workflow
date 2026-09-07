"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { updateProfileAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/ui/field";
import { UserAvatar } from "@/components/ui/avatar";

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; email: string; image: string; timezone: string; locale: "fr" | "en" };
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.ok ? <FormSuccess message={state.message} /> : null}
      {state && !state.ok ? <FormError message={state.error} /> : null}

      <div className="flex items-center gap-4">
        <UserAvatar name={defaults.name} image={defaults.image} className="size-14" />
        <p className="text-sm text-muted-foreground">
          L&apos;avatar est défini par une URL d&apos;image (ex : Gravatar, Dicebear).
        </p>
      </div>

      <Field label="Nom" htmlFor="name" error={errors?.name?.[0]} required>
        <Input id="name" name="name" defaultValue={defaults.name} required />
      </Field>

      <Field label="Email" htmlFor="email" hint="L'adresse email ne peut pas être modifiée ici.">
        <Input id="email" defaultValue={defaults.email} disabled />
      </Field>

      <Field label="URL de l'avatar" htmlFor="image" error={errors?.image?.[0]}>
        <Input id="image" name="image" type="url" defaultValue={defaults.image} placeholder="https://…" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fuseau horaire" htmlFor="timezone">
          <Input id="timezone" name="timezone" defaultValue={defaults.timezone} />
        </Field>
        <Field label="Langue" htmlFor="locale">
          <select
            id="locale"
            name="locale"
            defaultValue={defaults.locale}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Enregistrer
      </Button>
    </form>
  );
}
