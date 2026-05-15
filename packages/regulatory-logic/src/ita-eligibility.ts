/**
 * ITA (Injury Tracking Application) electronic submission eligibility
 * per 29 CFR 1904.41.
 *
 * Three tiers of covered establishments (1904.41(a)):
 *
 * Tier 1 — 250+ employees in any industry:
 *   Must submit Form 300A (annual summary). 1904.41(a)(1)(i).
 *
 * Tier 2 — 20–249 employees in designated high-hazard industries
 *   (Appendix A to Subpart E, 29 CFR Part 1904):
 *   Must submit Form 300A. 1904.41(a)(1)(ii).
 *   NOTE: "Appendix A to Subpart E" is NOT the same as "Appendix A to Subpart B"
 *   (the low-hazard exempt list). The Subpart E list covers high-hazard industries
 *   for which routine electronic 300A submission is required regardless of size above 20.
 *   In current regulatory practice, OSHA designates many industries for this tier;
 *   however, as of the current regulatory text, 250+ (any industry) and 100+ (Appendix B)
 *   are the well-defined thresholds. The 20-249 Appendix A tier is preserved here as
 *   a configurable lookup.
 *
 * Tier 3 — 100+ employees in high-hazard industries listed in Appendix B to Subpart E:
 *   Must submit Forms 300A, 300 (Log), AND 301 (Incident Reports). 1904.41(a)(2).
 *
 * Submission deadline: March 2 of the year after the calendar year covered. 1904.41(a)(2).
 *
 * Excluded fields for 300/301 electronic submission (1904.41(c)):
 *   - Form 300: Employee name (column B)
 *   - Form 301: Employee name, employee home address, name of physician, facility name/address
 */

import { ITAEligibilityInput, ITAEligibilityResult, ITATier } from "./types.js";
import { isAppendixBSubpartE300_301 } from "./naics-data.js";

// Employee count thresholds per 1904.41(a)
const TIER_1_THRESHOLD = 250;  // Any industry → 300A
const TIER_2_MIN = 20;         // Designated high-hazard industries → 300A
const TIER_2_MAX = 249;
const TIER_3_THRESHOLD = 100;  // Appendix B industries → 300A + 300 + 301

/**
 * Fields excluded from the 300 Log electronic submission. 1904.41(c)(1).
 */
export const EXCLUDED_FIELDS_300 = ["Employee name (column B)"] as const;

/**
 * Fields excluded from the 301 Incident Report electronic submission. 1904.41(c)(2).
 */
export const EXCLUDED_FIELDS_301 = [
  "Employee name",
  "Employee home address",
  "Name of physician or other health care professional",
  "Facility name (if treatment was given away from the worksite)",
  "Facility address (if treatment was given away from the worksite)",
] as const;

/**
 * Computes the March 2 submission deadline for a given reporting year. 1904.41(a)(2).
 * e.g., for reporting year 2024, the deadline is March 2, 2025.
 */
export function computeITADeadline(reportingYear: number): Date {
  return new Date(Date.UTC(reportingYear + 1, 2, 2)); // Month 2 = March (0-indexed)
}

/**
 * Determines whether an establishment must electronically submit OSHA injury/illness
 * data to OSHA's Injury Tracking Application, and which forms are required.
 */
export function checkITAEligibility(
  input: ITAEligibilityInput
): ITAEligibilityResult {
  const deadline = computeITADeadline(input.reportingYear);

  // Tier 3 check first: Appendix B high-hazard, 100+ employees → 300A + 300 + 301
  // 1904.41(a)(2)
  if (
    input.totalEmployeesInYear >= TIER_3_THRESHOLD &&
    isAppendixBSubpartE300_301(input.naicsCode)
  ) {
    return buildResult(
      "ALL_FORMS",
      `${input.totalEmployeesInYear} employees (≥${TIER_3_THRESHOLD}) in an Appendix B to Subpart E industry (NAICS ${input.naicsCode}). ` +
        "Must submit Forms 300A, 300 (Log), and 301 (Incident Reports).",
      "29 CFR 1904.41(a)(2)",
      deadline,
      [...EXCLUDED_FIELDS_300, ...EXCLUDED_FIELDS_301]
    );
  }

  // Tier 1 check: 250+ employees in any industry → 300A
  // 1904.41(a)(1)(i)
  if (input.totalEmployeesInYear >= TIER_1_THRESHOLD) {
    return buildResult(
      "300A_ONLY",
      `${input.totalEmployeesInYear} employees (≥${TIER_1_THRESHOLD}) in any industry. Must submit Form 300A.`,
      "29 CFR 1904.41(a)(1)(i)",
      deadline,
      []
    );
  }

  // Tier 2 check: 20–249 employees in Appendix A to Subpart E high-hazard industries → 300A
  // 1904.41(a)(1)(ii)
  // NOTE: For now we mark this tier as requiring checking against an authoritative
  // Appendix A to Subpart E list. The current implementation flags all non-Appendix-B
  // establishments in the 20–249 range as "check with OSHA" pending full Appendix A
  // Subpart E data. This is a known gap that will be resolved with a future data update.
  if (
    input.totalEmployeesInYear >= TIER_2_MIN &&
    input.totalEmployeesInYear <= TIER_2_MAX
  ) {
    // Appendix A to Subpart E is a separate list from Appendix A to Subpart B.
    // We do not have a complete machine-readable version of Appendix A to Subpart E
    // for the 20-249 tier. Employers in this range should verify their NAICS against
    // the current Appendix A to Subpart E at https://www.osha.gov/laws-regs/regulations/standardnumber/1904/1904SubpartEAppA
    // For safety (do not under-report), flag as potentially required.
    return {
      tier: "300A_ONLY",
      mustSubmit300A: true,
      mustSubmit300And301: false,
      reason:
        `${input.totalEmployeesInYear} employees (between ${TIER_2_MIN} and ${TIER_2_MAX}). ` +
        `NAICS ${input.naicsCode} may be in Appendix A to Subpart E (20–249 high-hazard tier). ` +
        "Verify your NAICS code against the current Appendix A to Subpart E at OSHA.gov. " +
        "If listed, Form 300A submission is required.",
      cfr: "29 CFR 1904.41(a)(1)(ii)",
      submissionDeadline: deadline,
      excludedFields: [],
    };
  }

  // Below 20 employees — no routine ITA submission required.
  return {
    tier: "NONE",
    mustSubmit300A: false,
    mustSubmit300And301: false,
    reason:
      `${input.totalEmployeesInYear} employees (below ${TIER_2_MIN}). ` +
      "No routine electronic submission to ITA required. Submission may still be required if OSHA or BLS notifies the employer in writing.",
    cfr: "29 CFR 1904.41(a)",
    submissionDeadline: deadline,
    excludedFields: [],
  };
}

function buildResult(
  tier: ITATier,
  reason: string,
  cfr: string,
  submissionDeadline: Date,
  excludedFields: readonly string[]
): ITAEligibilityResult {
  return {
    tier,
    mustSubmit300A: tier !== "NONE",
    mustSubmit300And301: tier === "ALL_FORMS",
    reason,
    cfr,
    submissionDeadline,
    excludedFields: [...excludedFields],
  };
}
