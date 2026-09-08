import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/http";
import {
  requireDocumentAccess,
  requireOrgMember,
  requireProjectAccess,
} from "@/server/context";
import { orgRoleAtLeast } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

type Actor = { id: string; name: string | null };

/** Projets visibles par l'utilisateur dans l'organisation. */
async function visibleProjectIds(organizationId: string, userId: string, isManager: boolean) {
  const projects = await prisma.project.findMany({
    where: { organizationId, ...(isManager ? {} : { members: { some: { userId } } }) },
    select: { id: true, name: true, key: true, color: true },
  });
  return projects;
}

export async function listDocuments(
  organizationId: string,
  userId: string,
  isManager: boolean,
  filters: { projectId?: string; folderId?: string; q?: string; archived?: boolean },
) {
  const projects = await visibleProjectIds(organizationId, userId, isManager);
  const projectIds = projects.map((p) => p.id);

  const where: Prisma.DocumentWhereInput = {
    organizationId,
    isArchived: filters.archived ?? false,
    OR: [{ projectId: null }, { projectId: { in: projectIds } }],
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
    ...(filters.folderId ? { folderId: filters.folderId } : {}),
    ...(filters.q
      ? {
          AND: [
            {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { content: { contains: filters.q, mode: "insensitive" } },
              ],
            },
          ],
        }
      : {}),
  };

  const documents = await prisma.document.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      isArchived: true,
      projectId: true,
      folderId: true,
      author: { select: { id: true, name: true, image: true } },
      project: { select: { id: true, key: true, name: true, color: true } },
      folder: { select: { id: true, name: true } },
      _count: { select: { attachments: true } },
    },
  });

  const folders = await prisma.folder.findMany({
    where: {
      organizationId,
      OR: [{ projectId: null }, { projectId: { in: projectIds } }],
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      parentId: true,
      projectId: true,
      _count: { select: { documents: true, children: true } },
    },
  });

  return { documents, folders, projects };
}

export async function getDocument(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      project: { select: { id: true, key: true, name: true } },
      folder: { select: { id: true, name: true } },
      attachments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
          uploadedBy: { select: { name: true } },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Contrôles d'écriture
// ---------------------------------------------------------------------------

/** Peut créer un document dans le périmètre donné. */
async function assertCanCreate(actor: Actor, organizationId: string, projectId?: string | null) {
  if (projectId) {
    const { projectRole, orgRole } = await requireProjectAccess(projectId);
    if (projectRole === "VIEWER" && !orgRoleAtLeast(orgRole, "MANAGER")) throw Errors.forbidden();
  } else {
    await requireOrgMember(organizationId);
  }
}

// ---------------------------------------------------------------------------
// Mutations documents
// ---------------------------------------------------------------------------

export async function createDocument(
  actor: Actor,
  organizationId: string,
  input: { title: string; content?: string; projectId?: string | null; folderId?: string | null },
) {
  await assertCanCreate(actor, organizationId, input.projectId);

  if (input.folderId) {
    const folder = await prisma.folder.findUnique({ where: { id: input.folderId } });
    if (!folder || folder.organizationId !== organizationId) throw Errors.badRequest("Dossier invalide");
    if ((folder.projectId ?? null) !== (input.projectId ?? null)) {
      throw Errors.badRequest("Le dossier n'appartient pas au même périmètre.");
    }
  }

  const doc = await prisma.document.create({
    data: {
      organizationId,
      projectId: input.projectId ?? null,
      folderId: input.folderId ?? null,
      authorId: actor.id,
      title: input.title,
      content: input.content ?? "",
    },
    select: { id: true, title: true, projectId: true },
  });

  await recordAudit({
    organizationId,
    actorId: actor.id,
    action: "document.create",
    resourceType: "Document",
    resourceId: doc.id,
    summary: `${actor.name} a créé le document « ${doc.title} »`,
  });
  return doc;
}

export async function updateDocument(
  actor: Actor,
  documentId: string,
  patch: { title?: string; content?: string; folderId?: string | null; isArchived?: boolean },
) {
  const { doc, orgRole, projectRole } = await requireDocumentAccess(documentId);
  const canEdit = projectRole ? projectRole !== "VIEWER" : true;
  if (!canEdit) throw Errors.forbidden();

  // Archivage/désarchivage = auteur ou manager.
  if (patch.isArchived !== undefined) {
    const isManager = orgRoleAtLeast(orgRole, "MANAGER");
    if (doc.authorId !== actor.id && !isManager) {
      throw Errors.forbidden("Seul l'auteur ou un manager peut archiver ce document.");
    }
  }

  if (patch.folderId) {
    const folder = await prisma.folder.findUnique({ where: { id: patch.folderId } });
    if (!folder || folder.organizationId !== doc.organizationId) throw Errors.badRequest("Dossier invalide");
    if ((folder.projectId ?? null) !== (doc.projectId ?? null)) {
      throw Errors.badRequest("Dossier hors périmètre.");
    }
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: patch.title,
      content: patch.content,
      folderId: patch.folderId === undefined ? undefined : patch.folderId,
      isArchived: patch.isArchived,
    },
  });

  if (patch.isArchived !== undefined) {
    await recordAudit({
      organizationId: doc.organizationId,
      actorId: actor.id,
      action: patch.isArchived ? "document.archive" : "document.restore",
      resourceType: "Document",
      resourceId: documentId,
      summary: `${actor.name} a ${patch.isArchived ? "archivé" : "restauré"} « ${updated.title} »`,
    });
  }
  return updated;
}

export async function deleteDocument(actor: Actor, documentId: string) {
  const { doc, orgRole } = await requireDocumentAccess(documentId);
  if (doc.authorId !== actor.id && !orgRoleAtLeast(orgRole, "MANAGER")) {
    throw Errors.forbidden("Suppression réservée à l'auteur ou à un manager.");
  }
  await prisma.document.delete({ where: { id: documentId } });
  await recordAudit({
    organizationId: doc.organizationId,
    actorId: actor.id,
    action: "document.delete",
    resourceType: "Document",
    resourceId: documentId,
    summary: `${actor.name} a supprimé le document « ${doc.title} »`,
  });
}

// ---------------------------------------------------------------------------
// Mutations dossiers
// ---------------------------------------------------------------------------

export async function createFolder(
  actor: Actor,
  organizationId: string,
  input: { name: string; projectId?: string | null; parentId?: string | null },
) {
  await assertCanCreate(actor, organizationId, input.projectId);

  if (input.parentId) {
    const parent = await prisma.folder.findUnique({ where: { id: input.parentId } });
    if (!parent || parent.organizationId !== organizationId) throw Errors.badRequest("Dossier parent invalide");
    if ((parent.projectId ?? null) !== (input.projectId ?? null)) {
      throw Errors.badRequest("Le parent n'appartient pas au même périmètre.");
    }
  }

  return prisma.folder.create({
    data: {
      organizationId,
      projectId: input.projectId ?? null,
      parentId: input.parentId ?? null,
      name: input.name,
    },
  });
}

async function loadFolderForWrite(actor: Actor, folderId: string) {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw Errors.notFound();
  if (folder.projectId) {
    const { projectRole, orgRole } = await requireProjectAccess(folder.projectId);
    if (projectRole === "VIEWER" && !orgRoleAtLeast(orgRole, "MANAGER")) throw Errors.forbidden();
  } else {
    await requireOrgMember(folder.organizationId);
  }
  return folder;
}

export async function renameFolder(actor: Actor, folderId: string, name: string) {
  await loadFolderForWrite(actor, folderId);
  return prisma.folder.update({ where: { id: folderId }, data: { name } });
}

export async function deleteFolder(actor: Actor, folderId: string) {
  const folder = await loadFolderForWrite(actor, folderId);
  // Les documents du dossier sont détachés (folderId -> null), pas supprimés.
  await prisma.$transaction([
    prisma.document.updateMany({ where: { folderId }, data: { folderId: null } }),
    prisma.folder.updateMany({ where: { parentId: folderId }, data: { parentId: folder.parentId } }),
    prisma.folder.delete({ where: { id: folderId } }),
  ]);
  await recordAudit({
    organizationId: folder.organizationId,
    actorId: actor.id,
    action: "folder.delete",
    resourceType: "Folder",
    resourceId: folderId,
    summary: `${actor.name} a supprimé le dossier « ${folder.name} »`,
  });
}
