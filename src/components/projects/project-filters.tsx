"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PROJECT_STATUS, PRIORITY } from "@/lib/constants";

export function ProjectFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = React.useState(params.get("q") ?? "");

  const update = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  React.useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update({ q: q || null });
    }, 300);
    return () => clearTimeout(t);
  }, [q, params, update]);

  const hasFilters = params.get("status") || params.get("priority") || params.get("q");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un projet…"
          className="pl-8"
        />
      </div>

      <select
        value={params.get("status") ?? ""}
        onChange={(e) => update({ status: e.target.value || null })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Tous les statuts</option>
        {Object.entries(PROJECT_STATUS).map(([v, s]) => (
          <option key={v} value={v}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={params.get("priority") ?? ""}
        onChange={(e) => update({ priority: e.target.value || null })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Toutes priorités</option>
        {Object.entries(PRIORITY).map(([v, p]) => (
          <option key={v} value={v}>
            {p.label}
          </option>
        ))}
      </select>

      <select
        value={params.get("sort") ?? "recent"}
        onChange={(e) => update({ sort: e.target.value === "recent" ? null : e.target.value })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="recent">Récents</option>
        <option value="name">Nom (A-Z)</option>
        <option value="priority">Priorité</option>
        <option value="endDate">Échéance</option>
      </select>

      {hasFilters ? (
        <button
          onClick={() => {
            setQ("");
            router.replace(pathname);
          }}
          className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" /> Réinitialiser
        </button>
      ) : null}
    </div>
  );
}
