/** Écart par défaut entre deux positions de colonne Kanban. */
export const BOARD_GAP = 1000;

/**
 * Calcule la position (`boardOrder`) d'une tâche insérée entre deux voisins.
 * `before` = ordre de la tâche juste au-dessus (null si tout en haut),
 * `after` = ordre de la tâche juste en dessous (null si tout en bas).
 */
export function computeBoardOrder(before: number | null, after: number | null): number {
  if (before === null && after === null) return BOARD_GAP;
  if (before === null) return (after as number) - BOARD_GAP;
  if (after === null) return before + BOARD_GAP;
  return (before + after) / 2;
}
