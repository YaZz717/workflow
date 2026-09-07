import Link from "next/link";
import { requireGlobalAdmin } from "@/server/context";
import { PageHeader } from "@/components/layout/page-header";

const tabs = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/organizations", label: "Organisations" },
  { href: "/admin/audit", label: "Journal d'audit" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireGlobalAdmin();

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Back-office de la plateforme — réservé aux administrateurs."
      />
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
