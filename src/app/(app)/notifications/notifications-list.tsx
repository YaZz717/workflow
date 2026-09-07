"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  actor: { name: string | null; image: string | null } | null;
};

export function NotificationsList() {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "list", filter],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?filter=${filter}&pageSize=50`);
      const json = await res.json();
      return json.data as { items: Item[]; pagination: { total: number } };
    },
  });

  const markAll = useMutation({
    mutationFn: () => fetch("/api/notifications", { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOne = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "unread"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "secondary" : "ghost"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Toutes" : "Non lues"}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
          <CheckCheck className="size-4" /> Tout marquer comme lu
        </Button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <EmptyState title="Aucune notification" description="Vous êtes à jour." />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3",
                  !n.readAt && "bg-accent/40",
                )}
              >
                <UserAvatar name={n.actor?.name} image={n.actor?.image} className="mt-0.5 size-8" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {n.link ? (
                      <Link href={n.link} className="hover:underline" onClick={() => markOne.mutate({ id: n.id, read: true })}>
                        {n.title}
                      </Link>
                    ) : (
                      n.title
                    )}
                  </p>
                  {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  title={n.readAt ? "Marquer non lu" : "Marquer lu"}
                  onClick={() => markOne.mutate({ id: n.id, read: !n.readAt })}
                >
                  <Check className={cn("size-4", n.readAt ? "opacity-30" : "text-primary")} />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
