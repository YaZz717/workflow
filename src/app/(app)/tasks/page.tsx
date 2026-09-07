import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = { title: "Mes tâches" };

export default function TasksPage() {
  return (
    <PhasePlaceholder
      title="Mes tâches"
      description="Toutes vos tâches, tous projets confondus."
      phase="Phase 3"
      features={[
        "Vue Kanban avec drag & drop entre colonnes (Backlog → Done)",
        "Vue liste avec recherche, filtres, tri et pagination",
        "Sous-tâches, tags, commentaires avec mentions @, pièces jointes",
        "Historique des modifications par tâche",
      ]}
    />
  );
}
