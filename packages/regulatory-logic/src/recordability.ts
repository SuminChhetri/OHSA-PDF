/**
 * Recordability determination engine per 29 CFR Part 1904, Subpart C.
 *
 * An employer must record a work-related injury or illness that meets one or more of
 * the recording criteria in 1904.7 (general criteria), 1904.8 (needlestick/sharps),
 * 1904.9 (medical removal), 1904.10 (hearing loss), or 1904.11 (tuberculosis).
 * — 1904.4(a)
 *
 * Three-part test:
 *  1. Is it work-related? (1904.5)
 *  2. Is it a new case? (1904.6)
 *  3. Does it meet a recording criterion? (1904.7–1904.11)
 */

import {
  RecordabilityInput,
  RecordabilityResult,
  DecisionStep,
} from "./types.js";
import { determineWorkRelatedness } from "./work-relatedness.js";
import { evaluateMedicalTreatment } from "./first-aid.js";

/**
 * Evaluates whether a case is OSHA recordable.
 *
 * Returns a full decision path so the result can be audited and displayed
 * in the recordability wizard.
 */
export function evaluateRecordability(
  input: RecordabilityInput
): RecordabilityResult {
  const path: DecisionStep[] = [];

  // ── Step 1: Work environment ─────────────────────────────────────────────
  // 1904.5(a): injury/illness must occur in the work environment.
  const workRelResult = determineWorkRelatedness({
    occurredInWorkEnvironment: input.inWorkEnvironment,
    applicableExceptions: input.workRelatednessExceptions,
  });

  path.push({
    step: "WORK_RELATEDNESS",
    question: "Did the injury or illness occur in the work environment, with no applicable exception under 1904.5(b)(2)?",
    answer: workRelResult.isWorkRelated,
    determination: workRelResult.isWorkRelated ? "CONTINUE" : "NOT_RECORDABLE",
    cfr: "29 CFR 1904.5",
    notes: workRelResult.reason,
  });

  if (!workRelResult.isWorkRelated) {
    return {
      isRecordable: false,
      reason: workRelResult.reason,
      cfr: "29 CFR 1904.5",
      decisionPath: path,
    };
  }

  // ── Step 2: New case ──────────────────────────────────────────────────────
  // 1904.6(a): evaluate whether event is a new case or a recurrence.
  // If it is not a new case but the outcome has changed (e.g., new days away),
  // the existing 300 Log entry must be updated rather than a new entry created.
  path.push({
    step: "NEW_CASE",
    question: "Is this a new case (not a previously recorded case whose outcome changed)?",
    answer: input.isNewCase,
    determination: input.isNewCase ? "CONTINUE" : "NOT_RECORDABLE",
    cfr: "29 CFR 1904.6",
    notes: input.isNewCase
      ? "This is a new case. Proceed to evaluate recording criteria."
      : "This is NOT a new case — it is a recurrence or change to an existing case. Update the existing 300 Log entry per 1904.33 rather than creating a new one.",
  });

  if (!input.isNewCase) {
    return {
      isRecordable: false,
      reason:
        "This is not a new case. Update the existing log entry per 1904.6 and 1904.33.",
      cfr: "29 CFR 1904.6, 1904.33",
      decisionPath: path,
    };
  }

  // ── Step 3: Special cases that are automatically recordable ─────────────

  // 1904.8: Needlestick and sharps injuries contaminated with blood or OPIM
  if (input.isNeedlestickWithBloodOrOPIM) {
    path.push({
      step: "NEEDLESTICK",
      question: "Is this a needlestick or sharps injury contaminated with blood or other potentially infectious material?",
      answer: true,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.8",
      notes: "Work-related needlestick/sharps injuries contaminated with blood or OPIM are always recordable under 1904.8, regardless of medical treatment received.",
    });
    return {
      isRecordable: true,
      reason: "Needlestick or sharps injury contaminated with blood or OPIM. 1904.8.",
      cfr: "29 CFR 1904.8",
      decisionPath: path,
    };
  }

  // 1904.10: Audiogram-confirmed Standard Threshold Shift (STS)
  if (input.isAudiogramConfirmedSTS) {
    path.push({
      step: "HEARING_LOSS",
      question: "Is this a work-related Standard Threshold Shift (STS) confirmed by audiogram?",
      answer: true,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.10",
      notes: "Work-related, audiogram-confirmed STS must be recorded on the 300 Log as hearing loss.",
    });
    return {
      isRecordable: true,
      reason: "Audiogram-confirmed work-related Standard Threshold Shift. 1904.10.",
      cfr: "29 CFR 1904.10",
      decisionPath: path,
    };
  }

  // 1904.11: Work-related tuberculosis diagnosis
  if (input.isWorkRelatedTBDiagnosis) {
    path.push({
      step: "TUBERCULOSIS",
      question: "Is this a work-related tuberculosis diagnosis following exposure at work?",
      answer: true,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.11",
      notes: "Work-related TB diagnosed after occupational exposure must be recorded.",
    });
    return {
      isRecordable: true,
      reason: "Work-related tuberculosis diagnosis. 1904.11.",
      cfr: "29 CFR 1904.11",
      decisionPath: path,
    };
  }

  // ── Step 4: General recording criteria — 1904.7(a) ───────────────────────

  // Criterion 1 — Death. 1904.7(a)(1).
  if (input.resultedInDeath) {
    path.push({
      step: "DEATH",
      question: "Did the injury or illness result in death?",
      answer: true,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.7(a)(1)",
      notes: "Death always makes the case recordable.",
    });
    return {
      isRecordable: true,
      reason: "The case resulted in the death of the employee. 1904.7(a)(1).",
      cfr: "29 CFR 1904.7(a)(1)",
      decisionPath: path,
    };
  }

  path.push({
    step: "DEATH",
    question: "Did the injury or illness result in death?",
    answer: false,
    determination: "CONTINUE",
    cfr: "29 CFR 1904.7(a)(1)",
  });

  // Criterion 2 — Days away from work. 1904.7(a)(2).
  if (input.daysAwayFromWork > 0) {
    path.push({
      step: "DAYS_AWAY",
      question: "Did the injury or illness result in days away from work?",
      answer: input.daysAwayFromWork,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.7(a)(2)",
      notes: `${input.daysAwayFromWork} day(s) away from work.`,
    });
    return {
      isRecordable: true,
      reason: `The case resulted in ${input.daysAwayFromWork} day(s) away from work. 1904.7(a)(2).`,
      cfr: "29 CFR 1904.7(a)(2)",
      decisionPath: path,
    };
  }

  path.push({
    step: "DAYS_AWAY",
    question: "Did the injury or illness result in days away from work?",
    answer: false,
    determination: "CONTINUE",
    cfr: "29 CFR 1904.7(a)(2)",
  });

  // Criterion 3 — Restricted work or job transfer. 1904.7(a)(3).
  if (input.daysOfRestrictedWork > 0 || input.daysOfJobTransfer > 0) {
    const days = input.daysOfRestrictedWork + input.daysOfJobTransfer;
    path.push({
      step: "RESTRICTED_WORK",
      question: "Did the injury or illness result in restricted work or job transfer?",
      answer: days,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.7(a)(3)",
      notes: `${input.daysOfRestrictedWork} restricted day(s), ${input.daysOfJobTransfer} transfer day(s).`,
    });
    return {
      isRecordable: true,
      reason: `The case resulted in restricted work or job transfer. ${input.daysOfRestrictedWork} restricted day(s), ${input.daysOfJobTransfer} transfer day(s). 1904.7(a)(3).`,
      cfr: "29 CFR 1904.7(a)(3)",
      decisionPath: path,
    };
  }

  path.push({
    step: "RESTRICTED_WORK",
    question: "Did the injury or illness result in restricted work or job transfer?",
    answer: false,
    determination: "CONTINUE",
    cfr: "29 CFR 1904.7(a)(3)",
  });

  // Criterion 4 — Medical treatment beyond first aid. 1904.7(a)(4).
  const medEval = evaluateMedicalTreatment(input.beyondFirstAidTreatments);
  const hasMedicalTreatmentBeyondFirstAid =
    input.receivedMedicalTreatment || medEval.isBeyondFirstAid;

  if (hasMedicalTreatmentBeyondFirstAid) {
    path.push({
      step: "MEDICAL_TREATMENT",
      question: "Did the case involve medical treatment beyond first aid?",
      answer: true,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.7(a)(4), 1904.7(b)(5)",
      notes: medEval.notes,
    });
    return {
      isRecordable: true,
      reason: `The case involved medical treatment beyond first aid. ${medEval.notes} 1904.7(a)(4).`,
      cfr: "29 CFR 1904.7(a)(4)",
      decisionPath: path,
    };
  }

  path.push({
    step: "MEDICAL_TREATMENT",
    question: "Did the case involve medical treatment beyond first aid?",
    answer: false,
    determination: "CONTINUE",
    cfr: "29 CFR 1904.7(a)(4), 1904.7(b)(5)(ii)",
    notes: "All treatments received are on the 1904.7(b)(5)(ii) first-aid list.",
  });

  // Criterion 5 — Loss of consciousness. 1904.7(a)(5).
  if (input.resultedInLossOfConsciousness) {
    path.push({
      step: "LOSS_OF_CONSCIOUSNESS",
      question: "Did the injury or illness result in loss of consciousness?",
      answer: true,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.7(a)(5)",
    });
    return {
      isRecordable: true,
      reason: "The case resulted in loss of consciousness. 1904.7(a)(5).",
      cfr: "29 CFR 1904.7(a)(5)",
      decisionPath: path,
    };
  }

  path.push({
    step: "LOSS_OF_CONSCIOUSNESS",
    question: "Did the injury or illness result in loss of consciousness?",
    answer: false,
    determination: "CONTINUE",
    cfr: "29 CFR 1904.7(a)(5)",
  });

  // Criterion 6 — Significant injury or illness diagnosed by LHCP. 1904.7(a)(6).
  if (input.diagnosedSignificantInjury) {
    path.push({
      step: "SIGNIFICANT_INJURY",
      question: "Was a significant injury or illness diagnosed by a physician or other licensed health care professional?",
      answer: true,
      determination: "RECORDABLE",
      cfr: "29 CFR 1904.7(a)(6)",
      notes: "Includes cancer, chronic irreversible diseases, fractured or cracked bones, and punctured eardrums.",
    });
    return {
      isRecordable: true,
      reason: "A significant injury or illness was diagnosed by a licensed health care professional. 1904.7(a)(6).",
      cfr: "29 CFR 1904.7(a)(6)",
      decisionPath: path,
    };
  }

  path.push({
    step: "SIGNIFICANT_INJURY",
    question: "Was a significant injury or illness diagnosed by a physician or other licensed health care professional?",
    answer: false,
    determination: "NOT_RECORDABLE",
    cfr: "29 CFR 1904.7(a)(6)",
    notes: "No recording criterion under 1904.7(a)(1)–(6) was met.",
  });

  return {
    isRecordable: false,
    reason:
      "The case is work-related and new, but does not meet any of the general recording criteria in 1904.7(a)(1)–(6), nor the special criteria in 1904.8–1904.11.",
    cfr: "29 CFR 1904.7",
    decisionPath: path,
  };
}
