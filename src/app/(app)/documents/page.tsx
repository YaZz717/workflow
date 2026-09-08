import type { Metadata } from "next";

import { requireUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentBrowser } from "@/components/documents/document-browser";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  await requireUser();
  await getActiveOrganization();

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Base de connaissances de l'organisation et des projets."
      />
      <DocumentBrowser />
    </div>
  );
}
