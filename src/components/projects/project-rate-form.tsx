"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { updateProjectAction } from "@/app/(app)/projects/actions";

export function ProjectRateForm({
  projectId,
  currentRateCents,
  locked,
}: {
  projectId: string;
  currentRateCents: number | null;
  locked: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rate, setRate] = React.useState(
    currentRateCents != null ? (currentRateCents / 100).toString() : "",
  );

  if (locked) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <div>
          Le taux horaire facturable est réservé aux organisations Pro.{" "}
          <Link href="/settings/organization" className="font-medium text-foreground underline underline-offset-2">
            Passer en Pro →
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const cents = rate.trim() ? Math.round(parseFloat(rate.replace(",", ".")) * 100) : "";
    const formData = new FormData();
    if (cents !== "") formData.set("hourlyRateCents", String(cents));

    const res = await updateProjectAction(projectId, null, formData);
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Taux horaire enregistré.");
    } else {
      setError(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? <FormError message={error} /> : null}
      <Field
        label="Taux horaire (€/h)"
        htmlFor="hourlyRateCents"
        hint="Utilisé pour calculer le montant facturable à partir du temps suivi sur ce projet."
      >
        <div className="flex gap-2">
          <Input
            id="hourlyRateCents"
            type="number"
            min={0}
            step="0.01"
            placeholder="45.00"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="max-w-40"
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Enregistrer
          </Button>
        </div>
      </Field>
    </form>
  );
}
