import { describe, it, expect } from "vitest";
import { computeBoardOrder, BOARD_GAP } from "@/lib/board-order";
import { extractMentions } from "@/lib/mentions";
import { updateTaskSchema, createTaskSchema } from "@/lib/validations/task";

describe("computeBoardOrder", () => {
  it("colonne vide", () => {
    expect(computeBoardOrder(null, null)).toBe(BOARD_GAP);
  });
  it("insertion en tête", () => {
    expect(computeBoardOrder(null, 1000)).toBe(0);
  });
  it("insertion en fin", () => {
    expect(computeBoardOrder(3000, null)).toBe(4000);
  });
  it("insertion entre deux", () => {
    expect(computeBoardOrder(1000, 2000)).toBe(1500);
  });
});

describe("extractMentions", () => {
  const users = [
    { id: "u1", name: "Camille Ferrand" },
    { id: "u2", name: "Hugo Martin" },
    { id: "u3", name: "Léa Dubois" },
  ];
  it("détecte une mention par prénom", () => {
    expect(extractMentions("Salut @Camille peux-tu voir ?", users)).toEqual(["u1"]);
  });
  it("détecte plusieurs mentions", () => {
    const r = extractMentions("@Hugo et @Léa on en parle", users);
    expect(r.sort()).toEqual(["u2", "u3"]);
  });
  it("ignore les non-mentions", () => {
    expect(extractMentions("email camille@x.fr", users)).toEqual([]);
  });
});

describe("updateTaskSchema — date 3 états", () => {
  it("échéance absente = non modifiée (undefined)", () => {
    const r = updateTaskSchema.parse({ status: "DONE" });
    expect(r.dueDate).toBeUndefined();
  });
  it("échéance null = effacée", () => {
    const r = updateTaskSchema.parse({ dueDate: null });
    expect(r.dueDate).toBeNull();
  });
  it("échéance datée", () => {
    const r = updateTaskSchema.parse({ dueDate: "2026-10-01" });
    expect(r.dueDate).toBeInstanceOf(Date);
  });
});

describe("createTaskSchema", () => {
  it("titre requis", () => {
    expect(createTaskSchema.safeParse({}).success).toBe(false);
  });
  it("valeurs par défaut", () => {
    const r = createTaskSchema.parse({ title: "Faire X" });
    expect(r.status).toBe("BACKLOG");
    expect(r.priority).toBe("MEDIUM");
    expect(r.assigneeIds).toEqual([]);
  });
});
