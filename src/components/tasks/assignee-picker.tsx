"use client";

import * as React from "react";
import { Check, UserPlus } from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectMemberLite } from "./types";

export function AssigneePicker({
  members,
  value,
  onChange,
  disabled,
}: {
  members: ProjectMemberLite[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const selected = members.filter((m) => value.includes(m.id));

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-left text-sm disabled:opacity-50"
      >
        {selected.length === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <UserPlus className="size-4" /> Assigner
          </span>
        ) : (
          selected.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-xs"
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[9px]">
                {initials(m.name)}
              </span>
              {m.name ?? m.email}
            </span>
          ))
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 w-56 overflow-y-auto p-1">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <UserAvatar name={m.name} image={m.image} className="size-5" />
            <span className="flex-1 truncate">{m.name ?? m.email}</span>
            <Check className={cn("size-4", value.includes(m.id) ? "opacity-100" : "opacity-0")} />
          </button>
        ))}
        {members.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">Aucun membre dans ce projet.</p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
