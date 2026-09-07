"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

export function SidebarNav({
  items,
  title,
  onNavigate,
}: {
  items: NavItem[];
  title?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {title ? (
        <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          {title}
        </p>
      ) : null}
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
