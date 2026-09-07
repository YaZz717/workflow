import { describe, it, expect } from "vitest";
import {
  orgRoleAtLeast,
  projectRoleAtLeast,
  can,
} from "@/lib/permissions";

describe("orgRoleAtLeast", () => {
  it("respecte la hiérarchie des rôles", () => {
    expect(orgRoleAtLeast("OWNER", "ADMIN")).toBe(true);
    expect(orgRoleAtLeast("ADMIN", "ADMIN")).toBe(true);
    expect(orgRoleAtLeast("MANAGER", "ADMIN")).toBe(false);
    expect(orgRoleAtLeast("GUEST", "MEMBER")).toBe(false);
  });
});

describe("projectRoleAtLeast", () => {
  it("compare LEAD > MEMBER > VIEWER", () => {
    expect(projectRoleAtLeast("LEAD", "MEMBER")).toBe(true);
    expect(projectRoleAtLeast("VIEWER", "MEMBER")).toBe(false);
  });
});

describe("can()", () => {
  it("un MEMBER peut créer une tâche mais pas un projet", () => {
    expect(can("MEMBER", "task.create")).toBe(true);
    expect(can("MEMBER", "project.create")).toBe(false);
  });

  it("un GUEST ne peut rien créer", () => {
    expect(can("GUEST", "task.create")).toBe(false);
    expect(can("GUEST", "comment.create")).toBe(false);
  });

  it("seul le OWNER gère la facturation et les rôles", () => {
    expect(can("ADMIN", "org.billing")).toBe(false);
    expect(can("OWNER", "org.billing")).toBe(true);
    expect(can("ADMIN", "member.role.update")).toBe(false);
    expect(can("OWNER", "member.role.update")).toBe(true);
  });

  it("un MANAGER peut gérer les projets", () => {
    expect(can("MANAGER", "project.create")).toBe(true);
    expect(can("MANAGER", "project.delete")).toBe(true);
    expect(can("MANAGER", "audit.read")).toBe(false);
  });
});
