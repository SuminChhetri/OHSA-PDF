/**
 * Privacy case rules per 29 CFR 1904.29(b)(6)–(9).
 *
 * 1904.29(b)(6): For certain cases, enter "privacy case" on the 300 Log instead of
 * the employee's name, and maintain a separate confidential list of names.
 *
 * 1904.29(b)(7): The following are "privacy concern cases":
 *   (i)   An injury or illness to an intimate body part or the reproductive system
 *   (ii)  An injury or illness resulting from a sexual assault
 *   (iii) Mental illness
 *   (iv)  HIV infection, hepatitis, or tuberculosis
 *   (v)   Needlestick injuries and cuts from sharp objects contaminated with another
 *         person's blood or other potentially infectious material (OPIM)
 *   (vi)  Other illnesses, if the employee voluntarily requests that his or her name
 *         not be entered on the log
 *
 * 1904.29(b)(8): The above is a COMPLETE list. Employers may not designate other
 * cases as privacy concern cases.
 *
 * 1904.29(b)(9): When a case is a privacy concern case, the employer may use
 * discretion to describe the injury/illness in a way that does not identify the
 * employee, while still capturing the cause and general severity.
 */

import { PrivacyCaseInput, PrivacyCaseResult, PrivacyReason } from "./types.js";

const PRIVACY_REASON_DESCRIPTIONS: Record<PrivacyReason, string> = {
  [PrivacyReason.INTIMATE_BODY_PART]:
    "Injury or illness to an intimate body part or the reproductive system. 1904.29(b)(7)(i).",
  [PrivacyReason.SEXUAL_ASSAULT]:
    "Injury or illness resulting from a sexual assault. 1904.29(b)(7)(ii).",
  [PrivacyReason.MENTAL_ILLNESS]:
    "Mental illness. 1904.29(b)(7)(iii).",
  [PrivacyReason.HIV_HEPATITIS_TB]:
    "HIV infection, hepatitis, or tuberculosis. 1904.29(b)(7)(iv).",
  [PrivacyReason.NEEDLESTICK]:
    "Needlestick or cut from sharp object contaminated with another person's blood or OPIM. 1904.29(b)(7)(v).",
  [PrivacyReason.EMPLOYEE_REQUEST]:
    "Employee voluntarily requested that their name not be entered on the log. 1904.29(b)(7)(vi).",
};

/**
 * Evaluates whether a case must be treated as a privacy concern case per 1904.29(b)(7).
 *
 * If it is a privacy case:
 *   - Enter "privacy case" on the 300 Log in place of the employee's name.
 *   - Maintain a separate confidential list linking the case number to the employee's identity.
 *   - The 301 Incident Report retains the employee's name (for government access per 1904.40).
 */
export function evaluatePrivacyCase(input: PrivacyCaseInput): PrivacyCaseResult {
  // Explicit privacy reason provided
  if (input.privacyReason) {
    return {
      isPrivacyCase: true,
      reason: input.privacyReason,
      cfr: "29 CFR 1904.29(b)(7)",
      logDisplayName: "privacy case",
    };
  }

  // Employee voluntary request (category vi)
  if (input.employeeRequestedPrivacy) {
    return {
      isPrivacyCase: true,
      reason: PrivacyReason.EMPLOYEE_REQUEST,
      cfr: "29 CFR 1904.29(b)(7)(vi)",
      logDisplayName: "privacy case",
    };
  }

  return {
    isPrivacyCase: false,
    cfr: "29 CFR 1904.29(b)(7)",
    logDisplayName: "", // Caller provides actual employee name
  };
}

/**
 * Returns the regulatory description for a privacy reason.
 */
export function describePrivacyReason(reason: PrivacyReason): string {
  return PRIVACY_REASON_DESCRIPTIONS[reason];
}

/**
 * Returns all privacy reasons and their descriptions.
 * Useful for building UI picker or COMPLIANCE.md documentation.
 * Per 1904.29(b)(8) this is a complete and exhaustive list.
 */
export function getAllPrivacyReasons(): Array<{
  reason: PrivacyReason;
  description: string;
  cfr: string;
}> {
  return Object.values(PrivacyReason).map((r) => ({
    reason: r,
    description: PRIVACY_REASON_DESCRIPTIONS[r],
    cfr: `29 CFR 1904.29(b)(7)`,
  }));
}

/**
 * Generates safe description text for a privacy case on the 300 Log, per 1904.29(b)(9).
 * The description must still identify the cause and general severity without identifying the employee.
 *
 * @param originalDescription  The full description as entered on the 301 form.
 * @param reason               The privacy reason that applies.
 * @returns A redacted description suitable for the 300 Log's public-facing columns.
 */
export function sanitizePrivacyCaseDescription(
  originalDescription: string,
  reason: PrivacyReason
): string {
  // For sexual assault and intimate body part cases, description must be carefully worded.
  // The employer "may use discretion" — this returns a generic placeholder the UI
  // can override. 1904.29(b)(9).
  const genericByType: Record<PrivacyReason, string> = {
    [PrivacyReason.INTIMATE_BODY_PART]: "Injury to body part — description withheld per 1904.29(b)(9)",
    [PrivacyReason.SEXUAL_ASSAULT]: "Injury resulting from workplace incident — description withheld per 1904.29(b)(9)",
    [PrivacyReason.MENTAL_ILLNESS]: "Mental health condition — description withheld per 1904.29(b)(9)",
    [PrivacyReason.HIV_HEPATITIS_TB]: "Communicable disease — description withheld per 1904.29(b)(9)",
    [PrivacyReason.NEEDLESTICK]: originalDescription, // Needlestick descriptions are generally safe to leave as-is
    [PrivacyReason.EMPLOYEE_REQUEST]: originalDescription, // Employee only requested name removal, not description removal
  };

  return genericByType[reason];
}
