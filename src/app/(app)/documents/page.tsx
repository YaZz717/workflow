import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <PhasePlaceholder
      title="Documents"
      description="Base de connaissances et fichiers par projet."
      phase="Phase 5"
      features={[
        "Création / édition / suppression de documents (contenu riche)",
        "Dossiers et arborescence",
        "Upload de fichiers avec limite de taille et vérification du type côté serveur",
        "Recherche plein-texte",
      ]}
    />
  );
}
