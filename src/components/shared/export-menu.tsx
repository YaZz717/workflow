"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL = [
  { type: "projects", label: "Projets" },
  { type: "tasks", label: "Tâches" },
  { type: "time", label: "Temps (équipe si manager)" },
  { type: "time?scope=me", label: "Mon temps" },
] as const;

export function ExportMenu({
  only,
  label = "Exporter",
}: {
  only?: ("projects" | "tasks" | "time")[];
  label?: string;
}) {
  const items = only
    ? ALL.filter((a) => only.some((o) => a.type.startsWith(o)))
    : ALL;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="size-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export CSV</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((i) => (
          <DropdownMenuItem key={i.type} asChild>
            <a href={`/api/export/${i.type}`} download>
              {i.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
