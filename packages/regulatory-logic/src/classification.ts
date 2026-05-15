/**
 * Case classification logic for 300 Log columns G–J and M1–M6.
 *
 * Columns G–J — Outcome classification (mutually exclusive):
 *   G = Death — 1904.7(a)(1)
 *   H = Days Away from Work — 1904.7(a)(2)
 *   I = Job Transfer or Restriction — 1904.7(a)(3)
 *   J = Other Recordable Cases — 1904.7(a)(4)–(6)
 *
 *   Rule: Only the MOST SERIOUS outcome is recorded. 1904.7(a).
 *   Severity order: Death > Days Away > Job Transfer/Restriction > Other Recordable.
 *
 * Columns M1–M6 — Case type (injury vs. illness, mutually exclusive):
 *   M1 = Injury
 *   M2 = Skin Disorder
 *   M3 = Respiratory Condition
 *   M4 = Poisoning
 *   M5 = Hearing Loss
 *   M6 = All Other Illnesses
 *
 *   Rule: Injury (M1) and illness (M2–M6) are mutually exclusive.
 *   Only one column is checked per case.
 */

import {
  CaseOutcome,
  CaseType,
  ClassificationInput,
  ClassificationResult,
} from "./types.js";

/**
 * Determines which 300 Log outcome column (G/H/I/J) to check, applying the
 * most-serious-outcome rule.
 *
 * Per 1904.7(a): "If the case involves one or more of the following, you must record
 * the case… You must enter the most serious outcome that applies."
 */
export function classifyOutcome(input: ClassificationInput): ClassificationResult {
  // Most serious first
  if (input.resultedInDeath) {
    return {
      outcome: CaseOutcome.DEATH,
      cfr: "29 CFR 1904.7(a)(1)",
      notes: "Death — column G. Most serious outcome takes precedence.",
    };
  }

  if (input.daysAwayFromWork > 0) {
    return {
      outcome: CaseOutcome.DAYS_AWAY,
      cfr: "29 CFR 1904.7(a)(2)",
      notes: `Days away from work (${input.daysAwayFromWork} day(s)) — column H.`,
    };
  }

  if (input.daysOfRestrictedOrTransfer > 0) {
    return {
      outcome: CaseOutcome.RESTRICTED_TRANSFER,
      cfr: "29 CFR 1904.7(a)(3)",
      notes: `Job transfer or restriction (${input.daysOfRestrictedOrTransfer} day(s)) — column I.`,
    };
  }

  if (input.hasOtherRecordableCriteria) {
    return {
      outcome: CaseOutcome.OTHER_RECORDABLE,
      cfr: "29 CFR 1904.7(a)(4)–(6)",
      notes:
        "Other recordable case (medical treatment beyond first aid, loss of consciousness, " +
        "or significant injury/illness diagnosed by LHCP) — column J.",
    };
  }

  // Caller should have confirmed recordability before calling this function.
  // If we reach here, the case should not have been submitted.
  throw new Error(
    "classifyOutcome called on a case that does not meet any recording criterion. " +
      "Run evaluateRecordability() first."
  );
}

/**
 * Returns a human-readable label for a CaseOutcome.
 */
export function describeCaseOutcome(outcome: CaseOutcome): string {
  switch (outcome) {
    case CaseOutcome.DEATH:
      return "Death (column G)";
    case CaseOutcome.DAYS_AWAY:
      return "Days Away from Work (column H)";
    case CaseOutcome.RESTRICTED_TRANSFER:
      return "Job Transfer or Restriction (column I)";
    case CaseOutcome.OTHER_RECORDABLE:
      return "Other Recordable Case (column J)";
  }
}

/**
 * Returns a human-readable label for a CaseType.
 */
export function describeCaseType(caseType: CaseType): string {
  switch (caseType) {
    case CaseType.INJURY:
      return "Injury (column M1)";
    case CaseType.SKIN_DISORDER:
      return "Skin Disorder (column M2)";
    case CaseType.RESPIRATORY:
      return "Respiratory Condition (column M3)";
    case CaseType.POISONING:
      return "Poisoning (column M4)";
    case CaseType.HEARING_LOSS:
      return "Hearing Loss (column M5)";
    case CaseType.ALL_OTHER_ILLNESS:
      return "All Other Illnesses (column M6)";
  }
}

/**
 * Validates that M1–M6 exclusivity is maintained. Returns true if the caseType
 * is valid given the claimed injury/illness nature.
 *
 * If isInjury is true, only CaseType.INJURY is valid.
 * If isInjury is false (it's an illness), CaseType.INJURY is invalid.
 */
export function validateCaseTypeExclusivity(
  caseType: CaseType,
  isInjury: boolean
): { valid: boolean; notes: string } {
  if (isInjury && caseType !== CaseType.INJURY) {
    return {
      valid: false,
      notes:
        "Case is classified as an injury (M1), but a non-injury type was selected. " +
        "Injury and illness are mutually exclusive. 1904.7.",
    };
  }
  if (!isInjury && caseType === CaseType.INJURY) {
    return {
      valid: false,
      notes:
        "Case is classified as an illness but CaseType.INJURY (M1) was selected. " +
        "Injury and illness are mutually exclusive. 1904.7.",
    };
  }
  return { valid: true, notes: "Case type is consistent with injury/illness classification." };
}
