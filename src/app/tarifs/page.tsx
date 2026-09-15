import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getCurrentUser } from "@/server/context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tarifs" };

const FREE_FEATURES = [
  "Projets, tâches et Kanban illimités",
  "Suivi du temps par tâche (chronomètre + saisie manuelle)",
  "Calendrier et documents partagés",
  "Jusqu'à 5 membres par organisation",
  "Export CSV des projets, tâches et temps",
];

const PRO_FEATURES = [
  "Tout ce qui est inclus dans Gratuit",
  "Nom de client sur chaque projet",
  "Taux horaire par projet",
  "Montant facturable calculé automatiquement",
  "Export CSV avec taux et montants facturables",
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const proHref = user ? "/settings/organization" : "/register";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Un tarif simple</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Gratuit pour gérer vos projets. Un seul palier payant, pour facturer votre temps à vos
            clients.
          </p>
        </section>

        <section className="mx-auto grid max-w-4xl gap-6 px-6 pb-24 sm:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Gratuit</CardTitle>
              <CardDescription>Pour démarrer sans limite de temps.</CardDescription>
              <p className="pt-4">
                <span className="text-4xl font-bold tracking-tight">0 €</span>
                <span className="text-muted-foreground"> / mois</span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex-1 space-y-3 text-sm">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link href="/register">
                  Commencer gratuitement <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col border-primary shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Pro</CardTitle>
                <Badge>Pour facturer vos clients</Badge>
              </div>
              <CardDescription>Pour les freelances et agences qui facturent leur temps.</CardDescription>
              <p className="pt-4">
                <span className="text-4xl font-bold tracking-tight">19 €</span>
                <span className="text-muted-foreground"> / mois</span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex-1 space-y-3 text-sm">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full">
                <Link href={proHref}>
                  {user ? "Passer en Pro" : "Créer mon compte"} <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="border-t bg-secondary/40">
          <div className="mx-auto max-w-2xl px-6 py-16 text-sm text-muted-foreground">
            <p>
              Sans engagement — résiliable à tout moment depuis les paramètres de votre
              organisation. Paiement sécurisé par{" "}
              <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                Stripe
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
