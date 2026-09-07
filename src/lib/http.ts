import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Erreur applicative avec code HTTP — capturée par `handleRoute`. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "ERROR",
    public details?: unknown,
  ) {
    super(message);
  }
}

export const Errors = {
  unauthorized: (msg = "Non authentifié") => new ApiError(401, msg, "UNAUTHORIZED"),
  forbidden: (msg = "Accès refusé") => new ApiError(403, msg, "FORBIDDEN"),
  notFound: (msg = "Ressource introuvable") => new ApiError(404, msg, "NOT_FOUND"),
  conflict: (msg = "Conflit") => new ApiError(409, msg, "CONFLICT"),
  badRequest: (msg = "Requête invalide", details?: unknown) =>
    new ApiError(400, msg, "BAD_REQUEST", details),
  rateLimited: (msg = "Trop de requêtes") => new ApiError(429, msg, "RATE_LIMITED"),
};

type Json = Record<string, unknown> | unknown[];

export function ok<T extends Json>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T extends Json>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Enveloppe un handler de route : convertit les erreurs connues
 * en réponses JSON cohérentes `{ error: { code, message } }`.
 */
export function handleRoute<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Données invalides",
              details: err.flatten(),
            },
          },
          { status: 422 },
        );
      }
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message, details: err.details } },
          { status: err.status },
        );
      }
      console.error("[API] Erreur non gérée :", err);
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "Erreur serveur" } },
        { status: 500 },
      );
    }
  };
}

/** Pagination : lit `?page=&pageSize=` avec des bornes raisonnables. */
export function readPagination(url: URL, defaultSize = 20, maxSize = 100) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    maxSize,
    Math.max(1, Number(url.searchParams.get("pageSize")) || defaultSize),
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
