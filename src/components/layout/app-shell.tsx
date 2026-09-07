"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutGrid, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Topbar } from "./topbar";
import { SidebarNav } from "./sidebar-nav";
import { OrgSwitcher } from "./org-switcher";
import { MAIN_NAV, ORG_NAV, ADMIN_NAV } from "./nav-config";
import { CommandPalette } from "@/components/search/command-palette";
import { RunningTimerBar } from "@/components/time/running-timer-bar";

type ShellProps = {
  user: { name?: string | null; email: string; image?: string | null; globalRole: "USER" | "ADMIN" };
  organizations: { id: string; name: string; logo: string | null }[];
  activeOrgId: string;
  children: React.ReactNode;
};

export function AppShell({ user, organizations, activeOrgId, children }: ShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isAdmin = user.globalRole === "ADMIN";

  const sidebarInner = (
    <>
      <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1 font-semibold text-white">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <LayoutGrid className="size-4" />
        </span>
        WorkFlow
      </Link>

      <div className="mt-4">
        <OrgSwitcher organizations={organizations} activeId={activeOrgId} />
      </div>

      <nav className="mt-4 flex-1 space-y-2 overflow-y-auto scrollbar-thin">
        <SidebarNav items={MAIN_NAV} onNavigate={() => setMobileOpen(false)} />
        <SidebarNav items={ORG_NAV} title="Organisation" onNavigate={() => setMobileOpen(false)} />
        {isAdmin ? (
          <SidebarNav items={ADMIN_NAV} title="Plateforme" onNavigate={() => setMobileOpen(false)} />
        ) : null}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-secondary/30">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col gap-1 bg-sidebar p-3 lg:flex">
        {sidebarInner}
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col gap-1 bg-sidebar p-3">
            <button
              className="absolute right-3 top-3 text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-5" />
            </button>
            {sidebarInner}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onOpenSidebar={() => setMobileOpen(true)} />
        <RunningTimerBar />
        <main className={cn("mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6")}>{children}</main>
      </div>

      <CommandPalette />
    </div>
  );
}
