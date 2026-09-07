import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = { title: "Suivi du temps" };

export default function TimePage() {
  return (
    <PhasePlaceholder
      title="Suivi du temps"
      description="Chronomètre, historique et statistiques."
      phase="Phase 4"
      features={[
        "Start / Pause / Stop d'un chronomètre par tâche (API déjà active)",
        "Saisie manuelle d'une durée",
        "Statistiques : aujourd'hui, semaine, mois, par projet, par utilisateur",
        "Historique complet et export",
      ]}
    />
  );
}
