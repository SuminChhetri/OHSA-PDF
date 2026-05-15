/**
 * Recordkeeping exemption checker per 29 CFR 1904.1 and 1904.2.
 *
 * Two independent exemptions:
 *
 * 1904.1 — Small employer exemption:
 *   "If your company had ten (10) or fewer employees at all times during the last
 *   calendar year, you do not need to keep OSHA injury and illness records unless
 *   OSHA or the BLS informs you in writing that you must keep records under §1904.41
 *   or §1904.42."
 *
 * 1904.2 — Low-hazard industry exemption:
 *   "If your establishment is classified in a specific low-hazard retail, service,
 *   finance, insurance, or real estate industry listed in Appendix A to this Subpart,
 *   you do not need to keep OSHA injury and illness records unless the government asks
 *   you to keep the records under §1904.41 or §1904.42."
 *
 * Critical: BOTH exemptions do NOT relieve the employer of the obligation to:
 *   - Report work-related fatalities within 8 hours (1904.39(a)(1))
 *   - Report work-related in-patient hospitalizations, amputations, or eye loss
 *     within 24 hours (1904.39(a)(2))
 */

import { ExemptionInput, ExemptionResult } from "./types.js";
import { isAppendixASubpartBExempt } from "./naics-data.js";

const SMALL_EMPLOYER_THRESHOLD = 10; // 1904.1(a)(1)

/**
 * Determines whether an establishment is exempt from routine OSHA recordkeeping.
 *
 * NOTE: Exemption from recordkeeping does NOT mean exemption from severe-injury
 * reporting under 1904.39. mustStillReportSevereInjuries is always true.
 */
export function checkExemption(input: ExemptionInput): ExemptionResult {
  // 1904.1: Small employer exemption — ≤10 employees at ALL TIMES in prior calendar year.
  if (input.peakEmployeeCountPriorYear <= SMALL_EMPLOYER_THRESHOLD) {
    return {
      isExempt: true,
      reason: "SMALL_EMPLOYER",
      cfr: "29 CFR 1904.1(a)(1)",
      notes:
        `Employer had ${input.peakEmployeeCountPriorYear} employee(s) at peak during the prior calendar year, ` +
        `which is at or below the threshold of ${SMALL_EMPLOYER_THRESHOLD}. ` +
        "Exempt from keeping 300/300A/301 records unless notified in writing by OSHA or BLS. 1904.1(a)(1).",
      mustStillReportSevereInjuries: true,
    };
  }

  // 1904.2: Low-hazard industry exemption — NAICS code in Appendix A to Subpart B.
  if (isAppendixASubpartBExempt(input.naicsCode)) {
    return {
      isExempt: true,
      reason: "LOW_HAZARD_INDUSTRY",
      cfr: "29 CFR 1904.2(a)",
      notes:
        `NAICS code ${input.naicsCode} is listed in Appendix A to Subpart B of Part 1904 ` +
        "(low-hazard industry). Exempt from keeping 300/300A/301 records unless notified " +
        "in writing by OSHA or BLS. 1904.2(a).",
      mustStillReportSevereInjuries: true,
    };
  }

  return {
    isExempt: false,
    cfr: "29 CFR 1904.1, 1904.2",
    notes:
      `Employer had ${input.peakEmployeeCountPriorYear} employees at peak (above ${SMALL_EMPLOYER_THRESHOLD}) ` +
      `and NAICS code ${input.naicsCode} is not in the Appendix A low-hazard exemption list. ` +
      "Must maintain OSHA 300/300A/301 records.",
    mustStillReportSevereInjuries: true,
  };
}
