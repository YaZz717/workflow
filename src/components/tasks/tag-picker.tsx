"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Tag as TagIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrgTags } from "./use-project-tasks";
import type { TagLite } from "./types";

const NEW_TAG_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

export function TagPicker({
  value,
  onChange,
  canCreate,
  disabled,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  canCreate?: boolean;
  disabled?: boolean;
}) {
  const { data: tags = [] } = useOrgTags();
  const qc = useQueryClient();
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const selected = tags.filter((t) => value.includes(t.id));

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  async function create() {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          color: NEW_TAG_COLORS[Math.floor(Math.random() * NEW_TAG_COLORS.length)],
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        await qc.invalidateQueries({ queryKey: ["org-tags"] });
        onChange([...value, data.tag.id]);
        setNewName("");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-left text-sm disabled:opacity-50"
      >
        {selected.length === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <TagIcon className="size-4" /> Ajouter des tags
          </span>
        ) : (
          selected.map((t) => (
            <span
              key={t.id}
              className="rounded-full px-1.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${t.color}22`, color: t.color }}
            >
              {t.name}
            </span>
          ))
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        <div className="max-h-52 overflow-y-auto">
          {tags.map((t: TagLite) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span className="size-3 rounded-full" style={{ background: t.color }} />
              <span className="flex-1 truncate">{t.name}</span>
              <Check className={cn("size-4", value.includes(t.id) ? "opacity-100" : "opacity-0")} />
            </button>
          ))}
        </div>
        {canCreate ? (
          <div className="mt-1 flex gap-1 border-t pt-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  create();
                }
              }}
              placeholder="Nouveau tag"
              className="h-7 text-xs"
            />
            <button
              type="button"
              onClick={create}
              disabled={creating || !newName.trim()}
              className="flex size-7 shrink-0 items-center justify-center rounded-md border hover:bg-accent disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
