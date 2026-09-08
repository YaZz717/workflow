import { notFound } from "next/navigation";

import { ApiError } from "@/lib/http";
import { requireDocumentAccess } from "@/server/context";
import { orgRoleAtLeast } from "@/lib/permissions";
import { DocumentEditor } from "@/components/documents/document-editor";
import type { PageParams } from "@/types/page";

export default async function DocumentPage({ params }: PageParams<{ docId: string }>) {
  const { docId } = await params;

  let access;
  try {
    access = await requireDocumentAccess(docId);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }

  const backHref = access.doc.projectId
    ? `/projects/${access.doc.projectId}/documents`
    : "/documents";

  return (
    <DocumentEditor
      documentId={docId}
      currentUserId={access.user.id}
      isManager={orgRoleAtLeast(access.orgRole, "MANAGER")}
      backHref={backHref}
    />
  );
}
