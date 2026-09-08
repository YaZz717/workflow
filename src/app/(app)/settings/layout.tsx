import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

const tabs = [
  { href: "/settings/profile", label: "Profil" },
  { href: "/settings/security", label: "Sécurité" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/organization", label: "Organisation" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader title="Paramètres" description="Gérez votre compte et votre organisation." />
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
