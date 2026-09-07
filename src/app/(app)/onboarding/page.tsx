import type { Metadata } from "next";

import { requireUser } from "@/server/context";
import { getUserOrganizations } from "@/server/organizations";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrgForm } from "./create-org-form";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  await requireUser();
  const memberships = await getUserOrganizations();
  if (memberships.length > 0) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Créez votre première organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>
    </div>
  );
}
