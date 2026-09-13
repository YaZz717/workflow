/** Montant facturable (en centimes) pour une durée donnée à un taux horaire donné (en centimes/h). */
export function billableAmountCents(durationSec: number, hourlyRateCents: number): number {
  return Math.round((durationSec * hourlyRateCents) / 3600);
}
