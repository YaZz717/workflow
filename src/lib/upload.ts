import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { randomBytes } from "node:crypto";

import { env } from "@/env";
import { ApiError } from "@/lib/http";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const UPLOAD_ROOT = resolve(process.cwd(), env.UPLOAD_DIR);

function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 120);
}

/**
 * Valide et stocke un fichier dans `UPLOAD_DIR/<scope>/`.
 * Renvoie les métadonnées à persister (dont `storageKey` relatif).
 */
export async function storeUpload(scope: string, file: File) {
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError(400, "Fichier vide ou absent", "BAD_REQUEST");
  }
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ApiError(413, `Fichier trop volumineux (max ${env.MAX_UPLOAD_MB} Mo)`, "FILE_TOO_LARGE");
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new ApiError(415, `Type de fichier non autorisé : ${file.type || "inconnu"}`, "UNSUPPORTED_MEDIA_TYPE");
  }

  const safeScope = sanitize(scope);
  const dir = join(UPLOAD_ROOT, safeScope);
  await mkdir(dir, { recursive: true });

  const base = sanitize(file.name) || `fichier${extname(file.name)}`;
  const key = `${safeScope}/${randomBytes(8).toString("hex")}-${base}`;
  const abs = join(UPLOAD_ROOT, key);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(abs, buffer);

  return {
    filename: file.name.slice(0, 200),
    mimeType: file.type,
    sizeBytes: file.size,
    storageKey: key,
  };
}

export async function readUpload(storageKey: string): Promise<Buffer> {
  const abs = resolve(UPLOAD_ROOT, storageKey);
  if (!abs.startsWith(UPLOAD_ROOT)) throw new ApiError(400, "Chemin invalide", "BAD_REQUEST");
  return readFile(abs);
}

export async function removeUpload(storageKey: string): Promise<void> {
  const abs = resolve(UPLOAD_ROOT, storageKey);
  if (!abs.startsWith(UPLOAD_ROOT)) return;
  await unlink(abs).catch(() => {});
}
