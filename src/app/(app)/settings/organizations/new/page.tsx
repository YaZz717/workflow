import type { Metadata } from "next";

import { requireUser } from "@/server/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrgForm } from "@/app/(app)/onboarding/create-org-form";

export const metadata: Metadata = { title: "Nouvelle organisation" };

export default async function NewOrganizationPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Créer une organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>
    </div>
  );
}
