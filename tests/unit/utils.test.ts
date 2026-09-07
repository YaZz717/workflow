import { describe, it, expect } from "vitest";
import {
  slugify,
  projectKeyFromName,
  initials,
  formatDuration,
  clamp,
} from "@/lib/utils";

describe("slugify", () => {
  it("normalise accents et espaces", () => {
    expect(slugify("Studio Nova")).toBe("studio-nova");
    expect(slugify("Équipe Créative !")).toBe("equipe-creative");
    expect(slugify("  --Hello--  ")).toBe("hello");
  });
});

describe("projectKeyFromName", () => {
  it("génère une clé courte en majuscules", () => {
    expect(projectKeyFromName("Refonte site vitrine")).toBe("RSV");
    expect(projectKeyFromName("Design")).toBe("DESI");
    expect(projectKeyFromName("")).toBe("PRJ");
  });
});

describe("initials", () => {
  it("prend les deux premières initiales", () => {
    expect(initials("Camille Ferrand")).toBe("CF");
    expect(initials("Hugo")).toBe("H");
    expect(initials(null)).toBe("?");
  });
});

describe("formatDuration", () => {
  it("formate secondes en h/min", () => {
    expect(formatDuration(30)).toBe("30s");
    expect(formatDuration(90)).toBe("1min");
    expect(formatDuration(3661)).toBe("1h 01");
  });
});

describe("clamp", () => {
  it("borne une valeur", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
