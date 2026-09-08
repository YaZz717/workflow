"use client";

import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge, PriorityBadge } from "@/components/shared/badges";
import type { BoardTask } from "./types";

export function TaskList({
  items,
  pagination,
  onPage,
  hrefFor,
  showProject,
}: {
  items: BoardTask[];
  pagination: { page: number; totalPages: number; total: number };
  onPage: (page: number) => void;
  hrefFor: (t: BoardTask) => string;
  showProject?: boolean;
}) {
  if (items.length === 0) {
    return <EmptyState title="Aucune tâche" description="Aucune tâche ne correspond aux filtres." />;
  }

  return (
    <div className="space-y-3">
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-medium">Réf</th>
              <th className="px-3 py-2.5 font-medium">Titre</th>
              {showProject ? <th className="hidden px-3 py-2.5 font-medium md:table-cell">Projet</th> : null}
              <th className="px-3 py-2.5 font-medium">Statut</th>
              <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Priorité</th>
              <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Échéance</th>
              <th className="px-3 py-2.5 font-medium">Assignés</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => {
              const overdue =
                t.dueDate && t.status !== "DONE" && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate));
              return (
                <tr key={t.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted-foreground">
                    {t.project.key}-{t.number}
                  </td>
                  <td className="px-3 py-2">
                    <Link href={hrefFor(t)} className="font-medium hover:underline">
                      {t.title}
                    </Link>
                    {t.tags.length > 0 ? (
                      <span className="ml-2 inline-flex gap-1">
                        {t.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full px-1.5 py-0.5 text-[10px]"
                            style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </td>
                  {showProject ? (
                    <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: t.project.color }} />
                        {t.project.name}
                      </span>
                    </td>
                  ) : null}
                  <td className="px-3 py-2">
                    <TaskStatusBadge status={t.status} />
                  </td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className={cn("hidden px-3 py-2 text-xs sm:table-cell", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                    {t.dueDate ? format(new Date(t.dueDate), "d MMM yyyy", { locale: fr }) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex -space-x-2">
                      {t.assignees.slice(0, 3).map((a) => (
                        <UserAvatar key={a.id} name={a.name} image={a.image} className="size-6 ring-2 ring-card" />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {pagination.total} tâche(s) · page {pagination.page}/{pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => onPage(pagination.page - 1)}
            >
              Précédent
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPage(pagination.page + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
