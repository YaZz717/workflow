import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  projectListQuerySchema,
} from "@/lib/validations/project";
import { inviteMemberSchema } from "@/lib/validations/organization";

describe("createProjectSchema", () => {
  it("accepte un projet minimal", () => {
    const r = createProjectSchema.safeParse({ name: "Site web" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.color).toBe("#6366f1");
      expect(r.data.priority).toBe("MEDIUM");
      expect(r.data.status).toBe("PLANNING");
    }
  });

  it("rejette un nom trop court", () => {
    expect(createProjectSchema.safeParse({ name: "x" }).success).toBe(false);
  });

  it("rejette une clé invalide", () => {
    expect(createProjectSchema.safeParse({ name: "Projet", key: "ab-c" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: "Projet", key: "WEB" }).success).toBe(true);
  });

  it("rejette une date de fin antérieure au début", () => {
    const r = createProjectSchema.safeParse({
      name: "Projet",
      startDate: "2026-10-01",
      endDate: "2026-09-01",
    });
    expect(r.success).toBe(false);
  });

  it("convertit les dates en objets Date", () => {
    const r = createProjectSchema.safeParse({ name: "Projet", startDate: "2026-10-01" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.startDate).toBeInstanceOf(Date);
  });
});

describe("projectListQuerySchema", () => {
  it("défaut sort = recent", () => {
    expect(projectListQuerySchema.parse({}).sort).toBe("recent");
  });
  it("ignore un statut inconnu", () => {
    expect(projectListQuerySchema.safeParse({ status: "NOPE" }).success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("met l'email en minuscules", () => {
    const r = inviteMemberSchema.parse({ email: "Test@Exemple.FR", role: "MEMBER" });
    expect(r.email).toBe("test@exemple.fr");
  });
  it("interdit le rôle OWNER via invitation", () => {
    expect(inviteMemberSchema.safeParse({ email: "a@b.fr", role: "OWNER" }).success).toBe(false);
  });
});
