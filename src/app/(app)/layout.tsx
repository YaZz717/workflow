import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/context";
import { getActiveOrganization, getUserOrganizations } from "@/server/organizations";
import { AppShell } from "@/components/layout/app-shell";

// Toutes les pages applicatives dépendent de la session et de l'organisation active.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");

  const memberships = await getUserOrganizations();
  if (memberships.length === 0) redirect("/onboarding");

  const activeOrg = await getActiveOrganization();

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        globalRole: user.globalRole,
      }}
      organizations={memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        logo: m.organization.logo,
      }))}
      activeOrgId={activeOrg.id}
    >
      {children}
    </AppShell>
  );
}
