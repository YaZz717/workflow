"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { switchOrganization } from "@/app/(app)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Org = { id: string; name: string; logo: string | null };

export function OrgSwitcher({
  organizations,
  activeId,
}: {
  organizations: Org[];
  activeId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const active = organizations.find((o) => o.id === activeId) ?? organizations[0];

  function select(id: string) {
    if (id === activeId) return;
    startTransition(async () => {
      await switchOrganization(id);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-2 rounded-md border border-sidebar-accent bg-sidebar-accent/40 px-2 py-2 text-left text-sm text-white transition-colors hover:bg-sidebar-accent disabled:opacity-60"
        disabled={pending}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
          {initials(active?.name)}
        </span>
        <span className="flex-1 truncate font-medium">{active?.name}</span>
        <ChevronsUpDown className="size-4 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Organisations</DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => select(org.id)}>
            <span className="flex size-6 items-center justify-center rounded bg-muted text-[10px] font-bold">
              {initials(org.name)}
            </span>
            <span className="flex-1 truncate">{org.name}</span>
            <Check className={cn("size-4", org.id === activeId ? "opacity-100" : "opacity-0")} />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings/organizations/new">
            <Plus /> Nouvelle organisation
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
