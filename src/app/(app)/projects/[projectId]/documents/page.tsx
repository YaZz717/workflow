import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/server/context";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
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

  const documents = await prisma.document.findMany({
    where: { projectId, isArchived: false },
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } }, folder: { select: { name: true } } },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {documents.length} document(s) · l&apos;édition et l&apos;upload de fichiers arrivent en Phase 5
      </p>
      {documents.length === 0 ? (
        <EmptyState icon={<FileText />} title="Aucun document" />
      ) : (
        <Card className="divide-y">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {d.folder ? `${d.folder.name} · ` : ""}
                  {d.author.name} · modifié{" "}
                  {formatDistanceToNow(d.updatedAt, { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
