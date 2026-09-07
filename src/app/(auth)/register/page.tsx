import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
