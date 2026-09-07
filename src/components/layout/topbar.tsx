"use client";

import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationsBell } from "./notifications-bell";
import { useCommandPalette } from "@/components/search/command-palette";

export function Topbar({
  user,
  onOpenSidebar,
}: {
  user: { name?: string | null; email: string; image?: string | null };
  onOpenSidebar: () => void;
}) {
  const { open } = useCommandPalette();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar}>
        <Menu className="size-5" />
      </Button>

      <button
        onClick={open}
        className="flex h-9 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-xs"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Rechercher…</span>
        <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <NotificationsBell />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
