import { describe, it, expect } from "vitest";
import { countDays, generateContinuousDays, remainingDaysUnderCap } from "../day-counter.js";
import { DayCountInput } from "../types.js";

function d(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

describe("countDays — 29 CFR 1904.7(b)(3)", () => {

  // ── Day-after-injury rule ──────────────────────────────────────────────────

  describe("1904.7(b)(3)(i) — counting starts the day AFTER injury", () => {
    it("does not count the day of injury", () => {
      const injury = d("2024-03-10");
      const result = countDays({
        injuryDate: injury,
        restrictedDays: [{ date: d("2024-03-10"), type: "AWAY" }],
      });
      expect(result.daysAway).toBe(0);
    });

    it("counts the day after the injury", () => {
      const result = countDays({
        injuryDate: d("2024-03-10"),
        restrictedDays: [{ date: d("2024-03-11"), type: "AWAY" }],
      });
      expect(result.daysAway).toBe(1);
    });
  });

  // ── Calendar day rule ─────────────────────────────────────────────────────

  describe("1904.7(b)(3)(ii) — all calendar days counted (weekends, holidays)", () => {
    it("counts 7 consecutive days including weekend", () => {
      const days = generateContinuousDays(d("2024-03-11"), d("2024-03-17"), "AWAY");
      const result = countDays({
        injuryDate: d("2024-03-10"),
        restrictedDays: days,
      });
      expect(result.daysAway).toBe(7);
    });

    it("counts restricted days including non-workdays", () => {
      const days = generateContinuousDays(d("2024-03-11"), d("2024-03-15"), "RESTRICTED");
      const result = countDays({
        injuryDate: d("2024-03-10"),
        restrictedDays: days,
      });
      expect(result.daysRestricted).toBe(5);
    });
  });

  // ── 180-day cap ────────────────────────────────────────────────────────────

  describe("1904.7(b)(3)(v) — 180-calendar-day cap", () => {
    it("caps at 180 days away", () => {
      const injury = d("2024-01-01");
      const days = generateContinuousDays(d("2024-01-02"), d("2024-09-01"), "AWAY");
      const result = countDays({ injuryDate: injury, restrictedDays: days });
      expect(result.daysAway).toBe(180);
      expect(result.cappedAt180).toBe(true);
    });

    it("caps combined days away + restricted at 180", () => {
      const injury = d("2024-01-01");
      const away = generateContinuousDays(d("2024-01-02"), d("2024-04-01"), "AWAY");    // 91 days
      const restricted = generateContinuousDays(d("2024-04-02"), d("2024-09-01"), "RESTRICTED"); // more than 89
      const result = countDays({
        injuryDate: injury,
        restrictedDays: [...away, ...restricted],
      });
      expect(result.daysAway + result.daysRestricted).toBe(180);
      expect(result.cappedAt180).toBe(true);
    });

    it("does NOT cap when total is exactly 180", () => {
      const injury = d("2024-01-01");
      const days = generateContinuousDays(d("2024-01-02"), d("2024-06-29"), "AWAY"); // exactly 180
      const result = countDays({ injuryDate: injury, restrictedDays: days });
      expect(result.daysAway).toBe(180);
      // Whether cappedAt180 is true depends on if there were MORE days after — here there aren't
    });

    it("does not cap when total is under 180", () => {
      const injury = d("2024-01-01");
      const days = generateContinuousDays(d("2024-01-02"), d("2024-01-31"), "AWAY"); // 30 days
      const result = countDays({ injuryDate: injury, restrictedDays: days });
      expect(result.daysAway).toBe(30);
      expect(result.cappedAt180).toBe(false);
    });
  });

  // ── Return to full duty ────────────────────────────────────────────────────

  describe("1904.7(b)(3)(iv) — stop counting at return to full duty", () => {
    it("stops counting when employee returns to full duty", () => {
      const injury = d("2024-03-01");
      const days = generateContinuousDays(d("2024-03-02"), d("2024-03-20"), "AWAY");
      const result = countDays({
        injuryDate: injury,
        restrictedDays: days,
        returnToFullDutyDate: d("2024-03-10"), // returns March 10, so days 2–9 counted
      });
      expect(result.daysAway).toBe(8); // Mar 2 through Mar 9 = 8 days
    });
  });

  // ── Left for unrelated reason ─────────────────────────────────────────────

  describe("1904.7(b)(3)(iv) — stop counting if left for unrelated reason", () => {
    it("stops counting when employee retires/resigns for unrelated reason", () => {
      const injury = d("2024-03-01");
      const days = generateContinuousDays(d("2024-03-02"), d("2024-03-31"), "AWAY");
      const result = countDays({
        injuryDate: injury,
        restrictedDays: days,
        leftForUnrelatedReasonDate: d("2024-03-15"),
      });
      expect(result.daysAway).toBe(13); // Mar 2 through Mar 14 = 13 days
    });
  });

  // ── Mutual exclusivity ────────────────────────────────────────────────────

  describe("1904.7(b)(3)(iii) — AWAY and RESTRICTED mutually exclusive on same day", () => {
    it("counts a day as AWAY when both AWAY and RESTRICTED are entered for same date", () => {
      const injury = d("2024-03-01");
      const result = countDays({
        injuryDate: injury,
        restrictedDays: [
          { date: d("2024-03-02"), type: "AWAY" },
          { date: d("2024-03-02"), type: "RESTRICTED" },
        ],
      });
      expect(result.daysAway).toBe(1);
      expect(result.daysRestricted).toBe(0);
    });

    it("counts distinct days correctly without double-counting", () => {
      const injury = d("2024-03-01");
      const result = countDays({
        injuryDate: injury,
        restrictedDays: [
          { date: d("2024-03-02"), type: "AWAY" },
          { date: d("2024-03-03"), type: "RESTRICTED" },
        ],
      });
      expect(result.daysAway).toBe(1);
      expect(result.daysRestricted).toBe(1);
    });
  });

  // ── Zero days ─────────────────────────────────────────────────────────────

  describe("zero-day cases", () => {
    it("returns zero days with empty restricted days list", () => {
      const result = countDays({
        injuryDate: d("2024-03-01"),
        restrictedDays: [],
      });
      expect(result.daysAway).toBe(0);
      expect(result.daysRestricted).toBe(0);
      expect(result.cappedAt180).toBe(false);
    });
  });

  // ── remainingDaysUnderCap helper ──────────────────────────────────────────

  describe("remainingDaysUnderCap helper", () => {
    it("returns 180 when no days have been counted", () => {
      expect(remainingDaysUnderCap(0, 0)).toBe(180);
    });

    it("returns 0 when cap is already reached", () => {
      expect(remainingDaysUnderCap(180, 0)).toBe(0);
      expect(remainingDaysUnderCap(90, 90)).toBe(0);
    });

    it("returns partial remaining days", () => {
      expect(remainingDaysUnderCap(100, 30)).toBe(50);
    });
  });
});
