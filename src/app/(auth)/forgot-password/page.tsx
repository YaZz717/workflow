import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          Entrez votre email, nous vous enverrons un lien de réinitialisation.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
