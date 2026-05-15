/**
 * Recordability decision wizard — 29 CFR 1904.4–1904.11.
 *
 * Implements a step-by-step decision tree that guides a recordkeeper through the
 * analysis required before committing a case to the 300 Log. Each step corresponds
 * to a specific CFR provision. Answers are accumulated incrementally and the final
 * determination is made only when all relevant questions have been answered.
 *
 * The wizard design follows the decision logic in OSHA's "Simplified Guide to
 * Recordkeeping" and the actual CFR text.
 */

import {
  RecordabilityInput,
  WizardState,
  WizardStepId,
  WizardStep,
} from "./types.js";
import { evaluateRecordability } from "./recordability.js";
import { WorkRelatednessException, BeyondFirstAidTreatment } from "./types.js";

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "WORK_ENVIRONMENT",
    question:
      "Did the injury or illness occur in the work environment — that is, at the establishment or another location where the employee was present as a condition of employment?",
    cfr: "29 CFR 1904.5(a)",
    hint:
      "The work environment includes the establishment and all other locations where one or more employees are working or are present as a condition of their employment, including company vehicles and field locations.",
  },
  {
    id: "WORK_RELATEDNESS_EXCEPTIONS",
    question:
      "Does any exception under 1904.5(b)(2) apply? (e.g., employee was a general public visitor, injury was from eating/drinking for personal consumption, common cold/flu, commute parking lot MVA, voluntary wellness program, personal grooming, personal task outside work hours, or mental illness without LHCP confirmation of work-relatedness)",
    cfr: "29 CFR 1904.5(b)(2)",
    hint:
      "Answer YES if any of these exceptions apply. If YES, the case is NOT work-related and need not be recorded.",
  },
  {
    id: "NEW_CASE",
    question:
      "Is this a new case? (A case is new if the employee has not previously experienced a recorded injury or illness of the same type affecting the same part of the body, OR if the employee previously recovered completely and a new event or exposure caused the recurrence.)",
    cfr: "29 CFR 1904.6(a)",
    hint:
      "If this is a recurrence of a previously recorded case where the employee did not fully recover, update the existing 300 Log entry rather than creating a new one.",
  },
  {
    id: "DEATH",
    question: "Did the injury or illness result in the death of the employee?",
    cfr: "29 CFR 1904.7(a)(1)",
  },
  {
    id: "DAYS_AWAY",
    question:
      "Did the injury or illness result in days away from work (beyond the day of the injury or onset of illness)?",
    cfr: "29 CFR 1904.7(a)(2)",
    hint:
      "Count all calendar days the employee was unable to work, including weekends and holidays. The day of injury itself is NOT counted.",
  },
  {
    id: "RESTRICTED_WORK_OR_TRANSFER",
    question:
      "Did the injury or illness result in restricted work (employee could not perform routine job functions or could not work the full shift) or a job transfer to another position?",
    cfr: "29 CFR 1904.7(a)(3)",
    hint:
      "Routine job functions are those the employee performs at least once per week. A physician's recommendation for restriction counts even if the employee does not comply.",
  },
  {
    id: "MEDICAL_TREATMENT_CHECK",
    question:
      "Did the employee receive medical treatment beyond first aid? Medical treatment includes any treatment not on the first-aid list in 1904.7(b)(5)(ii), such as prescription medications, sutures, surgery, rigid splints, physical therapy, or chiropractic care.",
    cfr: "29 CFR 1904.7(a)(4), 1904.7(b)(5)",
    hint:
      "First aid includes: non-prescription meds at non-prescription strength, tetanus shots, wound cleaning/covering, hot/cold therapy, elastic wraps, temporary splints for transport, nail/blister drainage, eye patches, simple foreign-body removal, finger guards, massage, and drinking fluids for heat stress.",
  },
  {
    id: "FIRST_AID_ONLY_CHECK",
    question:
      "Were ALL treatments received on the first-aid list in 1904.7(b)(5)(ii)? (If you answered YES to medical treatment beyond first aid above, skip this step.)",
    cfr: "29 CFR 1904.7(b)(5)(ii)",
  },
  {
    id: "LOSS_OF_CONSCIOUSNESS",
    question: "Did the injury or illness result in loss of consciousness?",
    cfr: "29 CFR 1904.7(a)(5)",
  },
  {
    id: "SIGNIFICANT_INJURY_DIAGNOSIS",
    question:
      "Was a significant injury or illness diagnosed by a physician or other licensed health care professional (LHCP), even if it does not result in death, days away, restriction, or medical treatment? Examples include cancer, chronic irreversible diseases, fractured or cracked bones, punctured eardrums.",
    cfr: "29 CFR 1904.7(a)(6)",
  },
  {
    id: "SPECIAL_CASES",
    question:
      "Is this a needlestick or sharps injury contaminated with blood or other potentially infectious material (OPIM), an audiogram-confirmed Standard Threshold Shift (STS), or a work-related tuberculosis (TB) diagnosis?",
    cfr: "29 CFR 1904.8, 1904.10, 1904.11",
    hint:
      "These special categories are automatically recordable regardless of treatment received.",
  },
  {
    id: "RESULT",
    question: "Recordability determination complete.",
    cfr: "29 CFR 1904.4",
  },
];

/** Returns the ordered list of step IDs for the wizard. */
export function getWizardStepIds(): WizardStepId[] {
  return WIZARD_STEPS.map((s) => s.id);
}

/** Returns a step definition by ID. */
export function getWizardStep(id: WizardStepId): WizardStep | undefined {
  return WIZARD_STEPS.find((s) => s.id === id);
}

/**
 * Creates the initial wizard state with no answers.
 */
export function createWizard(): WizardState {
  return {
    currentStep: "WORK_ENVIRONMENT",
    answers: {},
    completedSteps: [],
    isComplete: false,
  };
}

/**
 * Advances the wizard with an answer to the current step.
 *
 * The wizard uses short-circuit logic: as soon as a NOT_RECORDABLE or RECORDABLE
 * determination can be made, it jumps to the RESULT step and computes the final answer.
 *
 * @param state   Current wizard state (not mutated)
 * @param answer  The user's answer to the current step question
 * @returns       New wizard state after processing the answer
 */
export function advanceWizard(
  state: WizardState,
  answer: boolean | number | WorkRelatednessException[]
): WizardState {
  const newAnswers = { ...state.answers };
  const completed = [...state.completedSteps, state.currentStep];

  switch (state.currentStep) {
    case "WORK_ENVIRONMENT": {
      newAnswers.inWorkEnvironment = answer as boolean;
      if (!newAnswers.inWorkEnvironment) {
        // Not in work environment → not work-related → not recordable
        return finalizeWizard(newAnswers, completed);
      }
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "WORK_RELATEDNESS_EXCEPTIONS" };
    }

    case "WORK_RELATEDNESS_EXCEPTIONS": {
      const hasException = answer as boolean;
      newAnswers.workRelatednessExceptions = hasException
        ? [WorkRelatednessException.NON_WORK_EVENT] // Generic placeholder; UI should collect specifics
        : [];
      if (hasException) {
        return finalizeWizard(newAnswers, completed);
      }
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "NEW_CASE" };
    }

    case "NEW_CASE": {
      newAnswers.isNewCase = answer as boolean;
      if (!newAnswers.isNewCase) {
        return finalizeWizard(newAnswers, completed);
      }
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "DEATH" };
    }

    case "DEATH": {
      newAnswers.resultedInDeath = answer as boolean;
      if (newAnswers.resultedInDeath) {
        return finalizeWizard(newAnswers, completed);
      }
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "DAYS_AWAY" };
    }

    case "DAYS_AWAY": {
      const days = answer as number;
      newAnswers.daysAwayFromWork = days;
      if (days > 0) {
        return finalizeWizard(newAnswers, completed);
      }
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "RESTRICTED_WORK_OR_TRANSFER" };
    }

    case "RESTRICTED_WORK_OR_TRANSFER": {
      const hasRestriction = answer as boolean;
      if (hasRestriction) {
        newAnswers.daysOfRestrictedWork = 1; // At least one day
        newAnswers.daysOfJobTransfer = 0;
        return finalizeWizard(newAnswers, completed);
      }
      newAnswers.daysOfRestrictedWork = 0;
      newAnswers.daysOfJobTransfer = 0;
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "MEDICAL_TREATMENT_CHECK" };
    }

    case "MEDICAL_TREATMENT_CHECK": {
      newAnswers.receivedMedicalTreatment = answer as boolean;
      if (newAnswers.receivedMedicalTreatment) {
        newAnswers.beyondFirstAidTreatments = [BeyondFirstAidTreatment.PRESCRIPTION_MED]; // placeholder
        return finalizeWizard(newAnswers, completed);
      }
      newAnswers.beyondFirstAidTreatments = [];
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "LOSS_OF_CONSCIOUSNESS" };
    }

    case "LOSS_OF_CONSCIOUSNESS": {
      newAnswers.resultedInLossOfConsciousness = answer as boolean;
      if (newAnswers.resultedInLossOfConsciousness) {
        return finalizeWizard(newAnswers, completed);
      }
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "SIGNIFICANT_INJURY_DIAGNOSIS" };
    }

    case "SIGNIFICANT_INJURY_DIAGNOSIS": {
      newAnswers.diagnosedSignificantInjury = answer as boolean;
      if (newAnswers.diagnosedSignificantInjury) {
        return finalizeWizard(newAnswers, completed);
      }
      return { ...state, answers: newAnswers, completedSteps: completed, currentStep: "SPECIAL_CASES" };
    }

    case "SPECIAL_CASES": {
      const isSpecial = answer as boolean;
      newAnswers.isNeedlestickWithBloodOrOPIM = isSpecial;
      newAnswers.isAudiogramConfirmedSTS = false;
      newAnswers.isWorkRelatedTBDiagnosis = false;
      return finalizeWizard(newAnswers, completed);
    }

    default:
      return state;
  }
}

/**
 * Runs the recordability evaluation with the accumulated answers and returns a
 * completed wizard state.
 */
function finalizeWizard(
  answers: Partial<RecordabilityInput>,
  completed: WizardStepId[]
): WizardState {
  const fullInput = buildFullInput(answers);
  const result = evaluateRecordability(fullInput);
  return {
    currentStep: "RESULT",
    answers,
    completedSteps: [...completed, "RESULT"],
    result,
    isComplete: true,
  };
}

/** Fills in defaults for any unanswered fields so evaluateRecordability never sees undefined. */
function buildFullInput(partial: Partial<RecordabilityInput>): RecordabilityInput {
  return {
    inWorkEnvironment: partial.inWorkEnvironment ?? false,
    workRelatednessExceptions: partial.workRelatednessExceptions ?? [],
    isNewCase: partial.isNewCase ?? true,
    resultedInDeath: partial.resultedInDeath ?? false,
    daysAwayFromWork: partial.daysAwayFromWork ?? 0,
    daysOfRestrictedWork: partial.daysOfRestrictedWork ?? 0,
    daysOfJobTransfer: partial.daysOfJobTransfer ?? 0,
    receivedMedicalTreatment: partial.receivedMedicalTreatment ?? false,
    firstAidTreatmentsOnly: partial.firstAidTreatmentsOnly ?? [],
    beyondFirstAidTreatments: partial.beyondFirstAidTreatments ?? [],
    resultedInLossOfConsciousness: partial.resultedInLossOfConsciousness ?? false,
    diagnosedSignificantInjury: partial.diagnosedSignificantInjury ?? false,
    isNeedlestickWithBloodOrOPIM: partial.isNeedlestickWithBloodOrOPIM ?? false,
    isAudiogramConfirmedSTS: partial.isAudiogramConfirmedSTS ?? false,
    isWorkRelatedTBDiagnosis: partial.isWorkRelatedTBDiagnosis ?? false,
  };
}
