/**
 * Work-relatedness determination per 29 CFR 1904.5.
 *
 * Rule: An injury or illness is work-related if an event or exposure in the work
 * environment either caused or contributed to the resulting condition or significantly
 * aggravated a pre-existing injury or illness. Work-relatedness is presumed for
 * injuries and illnesses resulting from events or exposures occurring in the work
 * environment, unless an exception in § 1904.5(b)(2) specifically applies.
 * — 1904.5(a)
 */

import { WorkRelatednessException } from "./types.js";

export interface WorkRelatednessInput {
  /** True if the injury/illness occurred in the work environment. 1904.5(a). */
  occurredInWorkEnvironment: boolean;
  /**
   * Any exceptions from 1904.5(b)(2) that apply. If any applies, the injury
   * is NOT work-related (not recordable on that basis alone).
   */
  applicableExceptions: WorkRelatednessException[];
}

export interface WorkRelatednessResult {
  isWorkRelated: boolean;
  reason: string;
  cfr: string;
  appliedExceptions: WorkRelatednessException[];
}

const EXCEPTION_DESCRIPTIONS: Record<WorkRelatednessException, string> = {
  [WorkRelatednessException.GENERAL_PUBLIC]:
    "Employee was present as a member of the general public rather than as an employee. 1904.5(b)(2)(i).",
  [WorkRelatednessException.NON_WORK_EVENT]:
    "Injury/illness resulted solely from a non-work-related event or exposure that occurred outside the work environment. 1904.5(b)(2)(ii).",
  [WorkRelatednessException.VOLUNTARY_WELLNESS]:
    "Injury/illness resulted solely from voluntary participation in a wellness program, medical/fitness evaluation, or recreational activity. 1904.5(b)(2)(iii).",
  [WorkRelatednessException.EATING_DRINKING]:
    "Injury/illness resulted solely from eating, drinking, or preparing food or drink for personal consumption. 1904.5(b)(2)(iv).",
  [WorkRelatednessException.PERSONAL_TASK]:
    "Injury/illness resulted solely from performing personal tasks at the establishment outside of assigned working hours. 1904.5(b)(2)(v).",
  [WorkRelatednessException.PERSONAL_GROOMING]:
    "Injury/illness resulted solely from personal grooming, self-medication for a non-work-related condition, or is intentionally self-inflicted. 1904.5(b)(2)(vi).",
  [WorkRelatednessException.COMMUTE_PARKING]:
    "Injury/illness is a motor vehicle accident occurring on a company parking lot or access road while commuting to/from work. 1904.5(b)(2)(vii).",
  [WorkRelatednessException.COMMON_COLD_FLU]:
    "Illness is the common cold or flu. 1904.5(b)(2)(viii). NOTE: other contagious diseases (e.g., TB) are work-related if contracted at work.",
  [WorkRelatednessException.MENTAL_ILLNESS_UNCONFIRMED]:
    "Mental illness without objective evidence, confirmed by a licensed health care professional, that the illness is work-related. 1904.5(b)(2)(ix).",
};

/**
 * Determines whether an injury or illness is work-related under 29 CFR 1904.5.
 */
export function determineWorkRelatedness(
  input: WorkRelatednessInput
): WorkRelatednessResult {
  // If the event did not occur in the work environment, it is not presumed work-related.
  if (!input.occurredInWorkEnvironment) {
    return {
      isWorkRelated: false,
      reason:
        "The injury or illness did not occur in the work environment. " +
        "Work-relatedness is only presumed for events/exposures in the work environment. 1904.5(a).",
      cfr: "29 CFR 1904.5(a)",
      appliedExceptions: [],
    };
  }

  // Work-relatedness is presumed, now check exceptions. 1904.5(b)(2).
  const matched = input.applicableExceptions.filter(
    (e) => e in EXCEPTION_DESCRIPTIONS
  );

  if (matched.length > 0) {
    const descriptions = matched
      .map((e) => EXCEPTION_DESCRIPTIONS[e])
      .join(" | ");
    return {
      isWorkRelated: false,
      reason: `Work-relatedness exception(s) apply: ${descriptions}`,
      cfr: "29 CFR 1904.5(b)(2)",
      appliedExceptions: matched,
    };
  }

  return {
    isWorkRelated: true,
    reason:
      "The injury or illness occurred in the work environment and no exception under 1904.5(b)(2) applies. Work-relatedness is presumed. 1904.5(a).",
    cfr: "29 CFR 1904.5(a)",
    appliedExceptions: [],
  };
}

/** Human-readable description of a work-relatedness exception. */
export function describeException(e: WorkRelatednessException): string {
  return EXCEPTION_DESCRIPTIONS[e];
}
