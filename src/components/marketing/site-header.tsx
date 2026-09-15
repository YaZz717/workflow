import Link from "next/link";
import { LayoutGrid, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/context";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutGrid className="size-4" />
          </span>
          WorkFlow
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/tarifs"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Tarifs
          </Link>
          {user ? (
            <Button asChild>
              <Link href="/dashboard">
                Ouvrir l&apos;application <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Connexion</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Commencer gratuitement</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
