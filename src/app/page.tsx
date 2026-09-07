import Link from "next/link";
import {
  LayoutGrid,
  CheckSquare,
  Clock,
  Calendar,
  FileText,
  Bell,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/context";

export const dynamic = "force-dynamic";

const features = [
  { icon: CheckSquare, title: "Tâches & Kanban", desc: "Backlog, sous-tâches, drag & drop, filtres et vues personnalisées." },
  { icon: Clock, title: "Suivi du temps", desc: "Chronomètre par tâche, historique et statistiques par projet." },
  { icon: Calendar, title: "Calendrier", desc: "Deadlines, réunions et événements dans une vue unifiée." },
  { icon: FileText, title: "Documents", desc: "Base de connaissances par projet, dossiers et pièces jointes." },
  { icon: Bell, title: "Notifications", desc: "Assignations, mentions @, échéances et commentaires en temps réel." },
  { icon: Users, title: "Rôles & permissions", desc: "Owner, Admin, Manager, Member, Guest — appliqués côté serveur." },
  { icon: BarChart3, title: "Tableaux de bord", desc: "Indicateurs, activité récente et graphiques par organisation." },
  { icon: LayoutGrid, title: "Multi-organisations", desc: "Une seule connexion, plusieurs espaces de travail étanches." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="inline-flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutGrid className="size-4" />
            </span>
            WorkFlow
          </span>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">
                  Ouvrir l&apos;application <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Commencer gratuitement</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Nouveau · Suivi du temps intégré
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            La plateforme où votre équipe gère{" "}
            <span className="text-primary">projets, tâches et temps</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            WorkFlow réunit la gestion de projets, le Kanban, le suivi du temps, les documents
            et le calendrier dans un seul outil clair et rapide.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                Créer mon espace <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">J&apos;ai déjà un compte</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Compte de démo : <code className="rounded bg-muted px-1">camille@studionova.fr</code> /{" "}
            <code className="rounded bg-muted px-1">Password123</code>
          </p>
        </section>

        <section className="border-t bg-secondary/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border bg-card p-5">
                <f.icon className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        WorkFlow — projet de démonstration full-stack (Next.js, Prisma, PostgreSQL).
      </footer>
    </div>
  );
}
