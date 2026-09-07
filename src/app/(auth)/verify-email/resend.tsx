"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { resendVerificationAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSuccess } from "@/components/ui/field";

export function ResendVerification() {
  const [state, formAction, pending] = useActionState(resendVerificationAction, null);

  return (
    <form action={formAction} className="space-y-3 text-left">
      {state?.ok ? <FormSuccess message={state.message} /> : null}
      <Input name="email" type="email" placeholder="vous@exemple.fr" required />
      <Button type="submit" variant="outline" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Renvoyer le lien de vérification
      </Button>
    </form>
  );
}
