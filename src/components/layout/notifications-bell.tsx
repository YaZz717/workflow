"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

async function fetchNotifications(): Promise<{ items: NotificationItem[]; unread: number }> {
  const res = await fetch("/api/notifications?unread=preview");
  if (!res.ok) return { items: [], unread: 0 };
  const json = await res.json();
  return { items: json.data?.items ?? [], unread: json.data?.unread ?? 0 };
}

export function NotificationsBell() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications", "preview"],
    queryFn: fetchNotifications,
    refetchInterval: 90_000, // filet de sécurité ; le SSE fait la mise à jour temps réel
  });

  // Flux temps réel (Server-Sent Events) : recharge la liste quand le compteur change.
  React.useEffect(() => {
    const source = new EventSource("/api/notifications/stream");
    source.addEventListener("unread", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });
    source.onerror = () => source.close();
    return () => source.close();
  }, [qc]);

  const unread = data?.unread ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          <Link href="/notifications" className="text-xs text-primary hover:underline">
            Tout voir
          </Link>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {(data?.items ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Aucune notification.</p>
          ) : (
            data!.items.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "/notifications"}
                className="block border-b px-3 py-2.5 text-sm last:border-0 hover:bg-accent"
              >
                <div className="flex items-start gap-2">
                  {!n.readAt ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  ) : (
                    <span className="mt-1.5 size-2 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{n.title}</p>
                    {n.body ? <p className="truncate text-muted-foreground">{n.body}</p> : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
