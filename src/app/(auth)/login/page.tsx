import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
