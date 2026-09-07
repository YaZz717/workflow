"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { createOrganizationAction } from "../settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/ui/field";

export function CreateOrgForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createOrganizationAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <FormError message={state.error} /> : null}
      <Field label="Nom de l'organisation" htmlFor="name" error={errors?.name?.[0]} required>
        <Input id="name" name="name" placeholder="Mon équipe" required />
      </Field>
      <Field label="Description" htmlFor="description" error={errors?.description?.[0]}>
        <Textarea id="description" name="description" rows={3} />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Créer l&apos;organisation
      </Button>
    </form>
  );
}
