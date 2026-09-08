"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { inviteMemberAction } from "@/app/(app)/team/actions";

export function InviteMemberDialog({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setFieldErrors({});
    const res = await inviteMemberAction(null, formData);
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Invitation envoyée");
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
      setFieldErrors(res.fieldErrors ?? {});
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Inviter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          {error ? <FormError message={error} /> : null}
          <Field label="Adresse email" htmlFor="email" error={fieldErrors.email?.[0]} required>
            <Input id="email" name="email" type="email" placeholder="collegue@exemple.fr" required />
          </Field>
          <Field label="Rôle" htmlFor="role">
            <select
              id="role"
              name="role"
              defaultValue="MEMBER"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {canInviteAdmin ? <option value="ADMIN">Administrateur</option> : null}
              <option value="MANAGER">Manager</option>
              <option value="MEMBER">Membre</option>
              <option value="GUEST">Invité</option>
            </select>
          </Field>
          <p className="text-xs text-muted-foreground">
            Un email d&apos;invitation est envoyé (visible dans la console serveur en développement).
            L&apos;invitation expire dans 7 jours.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Envoyer l&apos;invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
