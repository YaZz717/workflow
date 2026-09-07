"use client";

import Link from "next/link";
import { LogOut, User as UserIcon, Settings } from "lucide-react";

import { UserAvatar } from "@/components/ui/avatar";
import { logoutAction } from "@/app/(app)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  user,
}: {
  user: { name?: string | null; email: string; image?: string | null };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <UserAvatar name={user.name} image={user.image} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="truncate font-medium text-foreground">{user.name}</div>
          <div className="truncate text-xs font-normal">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <UserIcon /> Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void logoutAction();
          }}
        >
          <LogOut /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
