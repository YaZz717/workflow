import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { getCurrentUser } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutGrid className="size-4" />
            </span>
            WorkFlow
          </Link>
          {children}
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.35),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-sidebar-foreground">
          <blockquote className="text-2xl font-medium leading-snug text-white">
            « Enfin un outil où mes projets, mes tâches et mon suivi du temps vivent au même
            endroit. »
          </blockquote>
          <p className="mt-4 text-sm text-sidebar-foreground">
            Camille Ferrand — Cheffe de projet, Studio Nova
          </p>
        </div>
      </div>
    </div>
  );
}
