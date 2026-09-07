import { ZodError, type ZodType } from "zod";

/** Résultat standard d'une Server Action. */
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionOk<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function actionError(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Valide `input` contre `schema` ; renvoie un `ActionResult` d'erreur si invalide. */
export function parseOrFail<S extends ZodType>(
  schema: S,
  input: unknown,
):
  | { success: true; data: import("zod").infer<S> }
  | { success: false; result: ActionResult<never> } {
  try {
    return { success: true, data: schema.parse(input) };
  } catch (err) {
    if (err instanceof ZodError) {
      const flat = err.flatten();
      return {
        success: false,
        result: actionError("Données invalides", flat.fieldErrors as Record<string, string[]>),
      };
    }
    throw err;
  }
}
