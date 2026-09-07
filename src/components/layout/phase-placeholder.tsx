import { Hammer } from "lucide-react";
import { PageHeader } from "./page-header";
import { Card, CardContent } from "@/components/ui/card";

/** Espace réservé pour les modules livrés dans une phase ultérieure. */
export function PhasePlaceholder({
  title,
  description,
  phase,
  features,
}: {
  title: string;
  description: string;
  phase: string;
  features: string[];
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Hammer className="size-5" />
          </span>
          <div>
            <p className="font-medium">Module prévu pour la {phase}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Le schéma de base de données et les routes API associés sont déjà en place.
            </p>
          </div>
          <ul className="mx-auto grid max-w-md gap-1.5 text-left text-sm text-muted-foreground">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
