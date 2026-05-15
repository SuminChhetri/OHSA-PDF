/**
 * Day-counting rules per 29 CFR 1904.7(b)(3).
 *
 * Rules implemented:
 * (i)  Begin counting the day AFTER the injury/illness onset.
 * (ii) Count ALL calendar days including weekends, holidays, and days the employee
 *      would not normally have worked.
 * (iii) Days away and days restricted/transferred are MUTUALLY EXCLUSIVE on the same
 *       calendar day — a day counts as whichever is more serious (away > restricted).
 * (iv) Stop counting when the employee returns to full duty without restrictions.
 *      Stop counting if the employee retires, resigns, or leaves for a reason
 *      unrelated to the injury/illness.
 * (v)  The count is capped at 180 calendar days.
 * (vi) Record days in the year the injury occurred, even if days extend into the
 *      following calendar year.
 * (vii) Follow physician recommendations regardless of whether the employee complies.
 */

import { DayCountInput, DayCountResult } from "./types.js";

const MAX_DAYS = 180; // 1904.7(b)(3)(v)

/**
 * Counts days away from work and days of restricted work/job transfer
 * for an OSHA 300 Log entry.
 *
 * The caller provides the list of restricted days (from physician recommendation),
 * keyed by calendar date and type. This function applies all regulatory rules
 * and returns the final counts for columns K and L of the 300 Log.
 */
export function countDays(input: DayCountInput): DayCountResult {
  const injuryDateNorm = normalizeDate(input.injuryDate);

  // Build a per-date map, enforcing mutual exclusivity.
  // If a date has both AWAY and RESTRICTED entries (data error), AWAY takes precedence
  // because it is the more serious outcome.
  const dayMap = new Map<string, "AWAY" | "RESTRICTED" | "TRANSFER">();

  for (const entry of input.restrictedDays) {
    const d = normalizeDate(entry.date);
    const key = toDateKey(d);

    // Rule: counting starts the day AFTER the injury. 1904.7(b)(3)(i).
    if (d <= injuryDateNorm) continue;

    // Rule: stop if employee left for unrelated reason before this date. 1904.7(b)(3)(iv).
    if (
      input.leftForUnrelatedReasonDate &&
      d >= normalizeDate(input.leftForUnrelatedReasonDate)
    ) {
      continue;
    }

    // Rule: stop at return-to-full-duty date (exclusive). 1904.7(b)(3)(iv).
    if (
      input.returnToFullDutyDate &&
      d >= normalizeDate(input.returnToFullDutyDate)
    ) {
      continue;
    }

    // Mutual exclusivity: AWAY is more serious than RESTRICTED/TRANSFER. 1904.7(b)(3)(iii).
    const existing = dayMap.get(key);
    if (existing === "AWAY") continue;
    if (entry.type === "AWAY") {
      dayMap.set(key, "AWAY");
    } else if (!existing) {
      dayMap.set(key, entry.type);
    }
    // If existing is RESTRICTED and new is TRANSFER (same severity level), keep existing.
  }

  // Sort dates and apply the 180-day cap.
  const sorted = Array.from(dayMap.entries())
    .map(([key, type]) => ({ date: fromDateKey(key), type }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let daysAway = 0;
  let daysRestricted = 0;
  let cappedAt180 = false;
  const effectiveDays: DayCountResult["effectiveDays"] = [];

  for (const { date, type } of sorted) {
    const total = daysAway + daysRestricted;
    if (total >= MAX_DAYS) {
      cappedAt180 = true;
      break;
    }
    effectiveDays.push({ date, type });
    if (type === "AWAY") {
      daysAway++;
    } else {
      daysRestricted++;
    }
  }

  return { daysAway, daysRestricted, cappedAt180, effectiveDays };
}

/**
 * Generates a sequence of calendar day entries for a simple continuous absence.
 * Useful for constructing DayCountInput when the employer knows "out from date A through date B."
 *
 * Does NOT apply any regulatory rules — that is done by countDays().
 */
export function generateContinuousDays(
  startDate: Date,
  endDate: Date,
  type: "AWAY" | "RESTRICTED" | "TRANSFER"
): DayCountInput["restrictedDays"] {
  const days: DayCountInput["restrictedDays"] = [];
  const current = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  while (current <= end) {
    days.push({ date: new Date(current), type });
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

/**
 * Returns how many calendar days remain before the 180-day cap is reached.
 */
export function remainingDaysUnderCap(currentDaysAway: number, currentDaysRestricted: number): number {
  return Math.max(0, MAX_DAYS - currentDaysAway - currentDaysRestricted);
}

// ─── Date utilities ──────────────────────────────────────────────────────────

/** Normalize a Date to midnight UTC to eliminate time-of-day from comparisons. */
function normalizeDate(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day));
}
