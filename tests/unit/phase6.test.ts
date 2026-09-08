import { describe, it, expect } from "vitest";
import { isTypeEnabled, normalizePrefs, CONFIGURABLE_TYPES } from "@/lib/notification-prefs";
import { toCsv } from "@/lib/csv";

describe("isTypeEnabled", () => {
  it("activé par défaut (préférences absentes)", () => {
    expect(isTypeEnabled(null, "MENTION")).toBe(true);
    expect(isTypeEnabled(undefined, "TASK_ASSIGNED")).toBe(true);
    expect(isTypeEnabled({}, "TASK_DUE_SOON")).toBe(true);
  });
  it("respecte une désactivation explicite", () => {
    expect(isTypeEnabled({ MENTION: { inApp: false } }, "MENTION")).toBe(false);
    expect(isTypeEnabled({ MENTION: { inApp: false } }, "TASK_ASSIGNED")).toBe(true);
  });
  it("ignore une valeur malformée", () => {
    expect(isTypeEnabled({ MENTION: "nope" }, "MENTION")).toBe(true);
  });
});

describe("normalizePrefs", () => {
  it("renvoie toutes les clés configurables", () => {
    const n = normalizePrefs({ MENTION: { inApp: false } });
    expect(Object.keys(n).length).toBe(CONFIGURABLE_TYPES.length);
    expect(n.MENTION.inApp).toBe(false);
    expect(n.TASK_ASSIGNED.inApp).toBe(true);
  });
});

describe("toCsv", () => {
  it("sépare par ; et gère l'échappement", () => {
    const csv = toCsv(["A", "B"], [["x", 'a;b "c"'], ["y", null]]);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines[0]).toBe("A;B");
    expect(lines[1]).toBe('x;"a;b ""c"""');
    expect(lines[2]).toBe("y;");
  });
  it("préfixe un BOM UTF-8", () => {
    expect(toCsv(["A"], []).charCodeAt(0)).toBe(0xfeff);
  });
});
