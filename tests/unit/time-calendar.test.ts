import { describe, it, expect } from "vitest";
import { manualEntrySchema, timeStatsQuerySchema } from "@/lib/validations/time";
import { createEventSchema } from "@/lib/validations/calendar";
import { formatDuration } from "@/lib/utils";

describe("manualEntrySchema", () => {
  it("accepte une saisie valide", () => {
    const r = manualEntrySchema.safeParse({
      taskId: "abc",
      date: "2026-09-08",
      durationMinutes: 90,
    });
    expect(r.success).toBe(true);
  });
  it("refuse une durée nulle ou > 24h", () => {
    expect(manualEntrySchema.safeParse({ taskId: "a", date: "2026-09-08", durationMinutes: 0 }).success).toBe(false);
    expect(manualEntrySchema.safeParse({ taskId: "a", date: "2026-09-08", durationMinutes: 2000 }).success).toBe(false);
  });
  it("coerce une durée en chaîne", () => {
    const r = manualEntrySchema.parse({ taskId: "a", date: "2026-09-08", durationMinutes: "45" });
    expect(r.durationMinutes).toBe(45);
  });
});

describe("timeStatsQuerySchema", () => {
  it("valeurs par défaut", () => {
    const r = timeStatsQuerySchema.parse({});
    expect(r.range).toBe("week");
    expect(r.scope).toBe("me");
  });
});

describe("createEventSchema", () => {
  it("refuse une fin avant le début", () => {
    const r = createEventSchema.safeParse({
      title: "Réu",
      startAt: "2026-09-08T14:00:00",
      endAt: "2026-09-08T13:00:00",
    });
    expect(r.success).toBe(false);
  });
  it("accepte un événement valide avec défauts", () => {
    const r = createEventSchema.parse({
      title: "Réu",
      startAt: "2026-09-08T10:00:00",
      endAt: "2026-09-08T11:00:00",
    });
    expect(r.type).toBe("MEETING");
    expect(r.allDay).toBe(false);
    expect(r.attendeeIds).toEqual([]);
  });
});

describe("formatDuration (récap)", () => {
  it("formate correctement les durées de suivi du temps", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(6180)).toBe("1h 43");
    expect(formatDuration(3600)).toBe("1h 00");
  });
});
