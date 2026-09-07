"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import {
  Search,
  FolderKanban,
  CheckSquare,
  FileText,
  User as UserIcon,
  Loader2,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type PaletteStore = { isOpen: boolean; open: () => void; close: () => void; toggle: () => void };

export const useCommandPalette = create<PaletteStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

type SearchHit = {
  type: "project" | "task" | "document" | "member";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const ICONS = {
  project: FolderKanban,
  task: CheckSquare,
  document: FileText,
  member: UserIcon,
} as const;

const GROUP_LABEL = {
  project: "Projets",
  task: "Tâches",
  document: "Documents",
  member: "Membres",
} as const;

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, close, toggle } = useCommandPalette();
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  React.useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        setHits([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const json = await res.json();
          setHits(json.data?.results ?? []);
        }
      } catch {
        /* annulé */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  function handleClose() {
    setQuery("");
    setHits([]);
    close();
  }

  function go(href: string) {
    handleClose();
    router.push(href);
  }

  const grouped = hits.reduce<Record<string, SearchHit[]>>((acc, h) => {
    (acc[h.type] ??= []).push(h);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (o ? undefined : handleClose())}>
      <DialogContent className="top-24 max-w-xl translate-y-0 gap-0 p-0" aria-describedby={undefined}>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher projets, tâches, documents, membres…"
            className="h-12 border-0 px-0 shadow-none focus-visible:ring-0"
          />
          {loading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        </div>

        <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
          {query.trim().length < 2 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères.
            </p>
          ) : hits.length === 0 && !loading ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Aucun résultat.</p>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="mb-2">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {GROUP_LABEL[type as SearchHit["type"]]}
                </p>
                {items.map((hit) => {
                  const Icon = ICONS[hit.type];
                  return (
                    <button
                      key={`${hit.type}-${hit.id}`}
                      onClick={() => go(hit.href)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{hit.title}</span>
                      {hit.subtitle ? (
                        <span className="truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
