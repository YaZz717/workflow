"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

import { formatDuration } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";

type Entry = {
  id: string;
  durationSec: number;
  description: string | null;
  source: string;
  startedAt: string;
  user: { id: string; name: string | null; image: string | null };
  task: { id: string; ref: string; title: string; project: { id: string; color: string } };
};

export function TimeEntriesTable({
  entries,
  pagination,
  totalSec,
  onPage,
  showUser,
}: {
  entries: Entry[];
  pagination: { page: number; totalPages: number; total: number };
  totalSec: number;
  onPage: (p: number) => void;
  showUser: boolean;
}) {
  const qc = useQueryClient();
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editH, setEditH] = React.useState("0");
  const [editM, setEditM] = React.useState("0");

  function refresh() {
    qc.invalidateQueries({ queryKey: ["time"] });
  }

  async function save(id: string) {
    const min = Math.round(Number(editH) * 60 + Number(editM));
    const res = await fetch(`/api/time/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes: min }),
    });
    if (res.ok) {
      setEditId(null);
      refresh();
    } else toast.error("Échec");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/time/entries/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
    else toast.error("Échec");
  }

  if (entries.length === 0) {
    return <EmptyState title="Aucune entrée de temps" description="Démarrez un chrono ou saisissez du temps manuellement." />;
  }

  return (
    <div className="space-y-3">
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Tâche</th>
              {showUser ? <th className="px-3 py-2.5 font-medium">Personne</th> : null}
              <th className="px-3 py-2.5 font-medium">Durée</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                  {format(new Date(e.startedAt), "d MMM yyyy", { locale: fr })}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/projects/${e.task.project.id}/tasks/${e.task.id}`}
                    className="hover:underline"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{e.task.ref}</span>{" "}
                    {e.task.title}
                  </Link>
                  {e.description ? (
                    <p className="text-xs text-muted-foreground">{e.description}</p>
                  ) : null}
                  {e.source === "manual" ? (
                    <span className="ml-1 rounded bg-muted px-1 text-[10px] text-muted-foreground">manuel</span>
                  ) : null}
                </td>
                {showUser ? (
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <UserAvatar name={e.user.name} image={e.user.image} className="size-5" />
                      {e.user.name}
                    </span>
                  </td>
                ) : null}
                <td className="px-3 py-2 font-medium tabular-nums">
                  {editId === e.id ? (
                    <span className="flex items-center gap-1">
                      <Input value={editH} onChange={(ev) => setEditH(ev.target.value)} className="h-7 w-12 px-1" />h
                      <Input value={editM} onChange={(ev) => setEditM(ev.target.value)} className="h-7 w-12 px-1" />m
                    </span>
                  ) : (
                    formatDuration(e.durationSec)
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {editId === e.id ? (
                    <span className="flex justify-end gap-1">
                      <Button size="icon" className="size-7" onClick={() => save(e.id)}>
                        <Check className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditId(null)}>
                        <X className="size-3.5" />
                      </Button>
                    </span>
                  ) : (
                    <span className="flex justify-end gap-1">
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditId(e.id);
                          setEditH(String(Math.floor(e.durationSec / 3600)));
                          setEditM(String(Math.round((e.durationSec % 3600) / 60)));
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(e.id)}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td className="px-3 py-2" colSpan={showUser ? 3 : 2}>
                Total (page + filtres)
              </td>
              <td className="px-3 py-2 tabular-nums">{formatDuration(totalSec)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </Card>

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {pagination.total} entrée(s) · page {pagination.page}/{pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>
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
