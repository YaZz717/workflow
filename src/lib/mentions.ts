/**
 * Extrait les mentions `@Prénom Nom` d'un texte en les faisant correspondre
 * à une liste d'utilisateurs candidats (membres du projet).
 * On teste d'abord le nom complet, puis le prénom seul.
 */
export function extractMentions(
  body: string,
  candidates: { id: string; name: string | null }[],
): string[] {
  const matched = new Set<string>();
  for (const user of candidates) {
    if (!user.name) continue;
    const full = user.name.trim();
    const first = full.split(/\s+/)[0];
    const patterns = [full, first].filter(Boolean);
    for (const p of patterns) {
      const re = new RegExp(`@${escapeRegex(p)}\\b`, "i");
      if (re.test(body)) {
        matched.add(user.id);
        break;
      }
    }
  }
  return [...matched];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
