/** Échappe une valeur pour un champ CSV (RFC 4180). */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Construit un contenu CSV (séparateur `;`, compatible Excel FR) avec BOM UTF-8. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(";"), ...rows.map((r) => r.map(cell).join(";"))];
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(filename: string, content: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
