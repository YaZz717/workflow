import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";
import type { PageParams } from "@/types/page";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };

export default async function ResetPasswordPage({ searchParams }: PageParams) {
  const { token } = await searchParams;
  const tokenStr = typeof token === "string" ? token : "";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">Choisissez un nouveau mot de passe sécurisé.</p>
      </div>

      {tokenStr ? (
        <ResetPasswordForm token={tokenStr} />
      ) : (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Lien invalide : aucun jeton fourni.
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
