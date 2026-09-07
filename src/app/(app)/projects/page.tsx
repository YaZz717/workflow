import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = { title: "Projets" };

export default function ProjectsPage() {
  return (
    <PhasePlaceholder
      title="Projets"
      description="Créez et pilotez les projets de votre organisation."
      phase="Phase 2"
      features={[
        "Liste et grille des projets avec statut, priorité, responsable et avancement",
        "Création / édition d'un projet (dates, membres, image, couleur)",
        "Dashboard par projet : activité, tâches, fichiers",
        "Statuts Planning / Active / On Hold / Completed / Archived",
      ]}
    />
  );
}
