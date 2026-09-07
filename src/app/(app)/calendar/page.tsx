import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = { title: "Calendrier" };

export default function CalendarPage() {
  return (
    <PhasePlaceholder
      title="Calendrier"
      description="Échéances, réunions et événements de l'équipe."
      phase="Phase 4"
      features={[
        "Vue mois / semaine avec tâches, deadlines et réunions",
        "Création d'événements et invitation de participants",
        "Clic sur un élément → accès direct à la tâche ou au projet",
      ]}
    />
  );
}
