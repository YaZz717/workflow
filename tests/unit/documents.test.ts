import { describe, it, expect } from "vitest";
import {
  createDocumentSchema,
  updateDocumentSchema,
  createFolderSchema,
} from "@/lib/validations/document";

describe("createDocumentSchema", () => {
  it("titre requis", () => {
    expect(createDocumentSchema.safeParse({}).success).toBe(false);
  });
  it("document général minimal", () => {
    const r = createDocumentSchema.parse({ title: "Notes" });
    expect(r.title).toBe("Notes");
  });
  it("accepte projectId et folderId", () => {
    const r = createDocumentSchema.parse({ title: "N", projectId: "p1", folderId: "f1" });
    expect(r.projectId).toBe("p1");
    expect(r.folderId).toBe("f1");
  });
});

describe("updateDocumentSchema", () => {
  it("permet de détacher d'un dossier (folderId null)", () => {
    const r = updateDocumentSchema.parse({ folderId: null });
    expect(r.folderId).toBeNull();
  });
  it("champ absent = non modifié", () => {
    const r = updateDocumentSchema.parse({ title: "X" });
    expect(r.folderId).toBeUndefined();
    expect(r.isArchived).toBeUndefined();
  });
});

describe("createFolderSchema", () => {
  it("nom requis, max 80", () => {
    expect(createFolderSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createFolderSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
    expect(createFolderSchema.safeParse({ name: "Specs" }).success).toBe(true);
  });
});
