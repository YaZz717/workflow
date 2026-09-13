import { describe, it, expect } from "vitest";

import { billableAmountCents } from "@/lib/money";
import { updateProjectSchema, createProjectSchema } from "@/lib/validations/project";

describe("billableAmountCents", () => {
  it("calcule le montant pour une heure pile", () => {
    // 3600s à 45,00 €/h (4500 centimes) = 4500 centimes.
    expect(billableAmountCents(3600, 4500)).toBe(4500);
  });

  it("arrondit correctement les durées non entières", () => {
    // 1h43 (6180s) à 45,00 €/h → 6180 * 4500 / 3600 = 7725 centimes exactement.
    expect(billableAmountCents(6180, 4500)).toBe(7725);
    // 100s à 33,33 €/h (3333 centimes) → 92.58333… arrondi à 93.
    expect(billableAmountCents(100, 3333)).toBe(93);
  });

  it("renvoie 0 sans temps ni taux", () => {
    expect(billableAmountCents(0, 4500)).toBe(0);
    expect(billableAmountCents(3600, 0)).toBe(0);
  });
});

describe("createProjectSchema (client)", () => {
  it("accepte un nom de client optionnel", () => {
    const r = createProjectSchema.safeParse({ name: "Refonte site", clientName: "Studio Nova" });
    expect(r.success).toBe(true);
  });
  it("reste valide sans client", () => {
    const r = createProjectSchema.safeParse({ name: "Refonte site" });
    expect(r.success).toBe(true);
  });
});

describe("updateProjectSchema (taux horaire)", () => {
  it("accepte un taux horaire positif, coercé en nombre", () => {
    const r = updateProjectSchema.safeParse({ hourlyRateCents: "4500" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.hourlyRateCents).toBe(4500);
  });
  it("refuse un taux horaire négatif", () => {
    expect(updateProjectSchema.safeParse({ hourlyRateCents: -1 }).success).toBe(false);
  });
});
