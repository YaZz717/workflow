import { notFound } from "next/navigation";

import { ApiError } from "@/lib/http";
import { requireProjectAccess } from "@/server/context";
import { DocumentBrowser } from "@/components/documents/document-browser";
import type { PageParams } from "@/types/page";

export default async function ProjectDocumentsPage({
  params,
}: PageParams<{ projectId: string }>) {
  const { projectId } = await params;

  try {
    await requireProjectAccess(projectId);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }

  return <DocumentBrowser fixedProjectId={projectId} />;
}
