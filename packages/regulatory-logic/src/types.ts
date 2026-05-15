// 29 CFR Part 1904 — shared types for the OSHA recordkeeping regulatory logic engine.
// Every enum value and field maps to a specific CFR provision cited inline.

// ─── Classification ──────────────────────────────────────────────────────────

/** 300 Log columns G–J (mutually exclusive; most-serious-outcome rule). 1904.7(a). */
export enum CaseOutcome {
  DEATH = "DEATH",                           // col G — 1904.7(a)(1)
  DAYS_AWAY = "DAYS_AWAY",                   // col H — 1904.7(a)(2)
  RESTRICTED_TRANSFER = "RESTRICTED_TRANSFER", // col I — 1904.7(a)(3)
  OTHER_RECORDABLE = "OTHER_RECORDABLE",     // col J — 1904.7(a)(4–6)
}

/** 300 Log columns M1–M6 (injury vs. illness mutually exclusive). 1904.7(a). */
export enum CaseType {
  INJURY = "INJURY",                         // col M1
  SKIN_DISORDER = "SKIN_DISORDER",           // col M2
  RESPIRATORY = "RESPIRATORY",               // col M3
  POISONING = "POISONING",                   // col M4
  HEARING_LOSS = "HEARING_LOSS",             // col M5
  ALL_OTHER_ILLNESS = "ALL_OTHER_ILLNESS",   // col M6
}

// ─── Privacy ─────────────────────────────────────────────────────────────────

/** Complete enumeration per 1904.29(b)(7) — 1904.29(b)(8) states this list is exhaustive. */
export enum PrivacyReason {
  INTIMATE_BODY_PART = "INTIMATE_BODY_PART",   // 1904.29(b)(7)(i)
  SEXUAL_ASSAULT = "SEXUAL_ASSAULT",            // 1904.29(b)(7)(ii)
  MENTAL_ILLNESS = "MENTAL_ILLNESS",            // 1904.29(b)(7)(iii)
  HIV_HEPATITIS_TB = "HIV_HEPATITIS_TB",        // 1904.29(b)(7)(iv)
  NEEDLESTICK = "NEEDLESTICK",                  // 1904.29(b)(7)(v)
  EMPLOYEE_REQUEST = "EMPLOYEE_REQUEST",        // 1904.29(b)(7)(vi)
}

// ─── Severe Injury ───────────────────────────────────────────────────────────

/** Severe injury/illness types triggering mandatory OSHA reporting. 1904.39. */
export enum SeverityLevel {
  FATALITY = "FATALITY",               // 1904.39(a)(1) — report within 8 hours
  HOSPITALIZATION = "HOSPITALIZATION", // 1904.39(a)(2)(i) — report within 24 hours
  AMPUTATION = "AMPUTATION",           // 1904.39(a)(2)(ii) — report within 24 hours
  EYE_LOSS = "EYE_LOSS",               // 1904.39(a)(2)(iii) — report within 24 hours
}

// ─── Work-Relatedness ────────────────────────────────────────────────────────

/**
 * Exceptions to the presumption of work-relatedness. 1904.5(b)(2).
 * If any exception applies, the injury/illness is NOT work-related.
 */
export enum WorkRelatednessException {
  GENERAL_PUBLIC = "GENERAL_PUBLIC",               // 1904.5(b)(2)(i)
  NON_WORK_EVENT = "NON_WORK_EVENT",               // 1904.5(b)(2)(ii)
  VOLUNTARY_WELLNESS = "VOLUNTARY_WELLNESS",       // 1904.5(b)(2)(iii)
  EATING_DRINKING = "EATING_DRINKING",             // 1904.5(b)(2)(iv)
  PERSONAL_TASK = "PERSONAL_TASK",                 // 1904.5(b)(2)(v)
  PERSONAL_GROOMING = "PERSONAL_GROOMING",         // 1904.5(b)(2)(vi)
  COMMUTE_PARKING = "COMMUTE_PARKING",             // 1904.5(b)(2)(vii)
  COMMON_COLD_FLU = "COMMON_COLD_FLU",             // 1904.5(b)(2)(viii)
  MENTAL_ILLNESS_UNCONFIRMED = "MENTAL_ILLNESS_UNCONFIRMED", // 1904.5(b)(2)(ix)
}

// ─── First Aid ───────────────────────────────────────────────────────────────

/**
 * Complete list of first-aid treatments from 1904.7(b)(5)(ii).
 * Treatments in this list are NOT "medical treatment beyond first aid"
 * and therefore do not alone make a case recordable.
 */
export enum FirstAidTreatment {
  NON_PRESCRIPTION_MED = "NON_PRESCRIPTION_MED",       // (A) non-prescription meds at non-prescription strength
  TETANUS_IMMUNIZATION = "TETANUS_IMMUNIZATION",       // (B) tetanus immunizations
  WOUND_CLEANING = "WOUND_CLEANING",                   // (C) cleaning/flushing/soaking surface wounds
  WOUND_COVERING = "WOUND_COVERING",                   // (D) wound coverings (bandages, Band-Aids, gauze, butterfly strips, Steri-strips)
  HOT_COLD_THERAPY = "HOT_COLD_THERAPY",               // (E) hot or cold therapy
  NON_RIGID_SUPPORT = "NON_RIGID_SUPPORT",             // (F) non-rigid means of support (elastic bandages, wraps, non-rigid back belts)
  TEMPORARY_IMMOBILIZATION = "TEMPORARY_IMMOBILIZATION", // (G) temporary immobilization device for transport (splints, slings, neck collars, back boards)
  NAIL_BLISTER_DRAINAGE = "NAIL_BLISTER_DRAINAGE",     // (H) drilling fingernail/toenail or draining blister
  EYE_PATCH = "EYE_PATCH",                             // (I) eye patches
  EYE_FOREIGN_BODY_REMOVAL = "EYE_FOREIGN_BODY_REMOVAL", // (J) removing foreign body from eye by irrigation or cotton swab
  SPLINTER_REMOVAL = "SPLINTER_REMOVAL",               // (K) removing splinters/foreign material by simple means (tweezers, cotton swabs)
  FINGER_GUARD = "FINGER_GUARD",                       // (L) finger guards
  MASSAGE = "MASSAGE",                                 // (M) massages
  HEAT_STRESS_FLUIDS = "HEAT_STRESS_FLUIDS",           // (N) drinking fluids for relief of heat stress
}

/** Medical treatments that ARE "beyond first aid" — receiving any makes case recordable if work-related. */
export enum BeyondFirstAidTreatment {
  PRESCRIPTION_MED = "PRESCRIPTION_MED",
  SUTURES = "SUTURES",
  STAPLES = "STAPLES",
  SURGERY = "SURGERY",
  RIGID_SPLINT = "RIGID_SPLINT",
  PHYSICAL_THERAPY = "PHYSICAL_THERAPY",
  CHIROPRACTIC = "CHIROPRACTIC",
  IRRIGATION_BEYOND_FIRST_AID = "IRRIGATION_BEYOND_FIRST_AID",
  DEBRIDEMENT = "DEBRIDEMENT",
  CAST = "CAST",
}

// ─── Recordability Inputs ────────────────────────────────────────────────────

export interface RecordabilityInput {
  // 1904.5 — work environment
  inWorkEnvironment: boolean;
  workRelatednessExceptions: WorkRelatednessException[];

  // 1904.6 — new vs. existing case
  isNewCase: boolean;

  // 1904.7 — general recording criteria
  resultedInDeath: boolean;
  daysAwayFromWork: number;          // 0 means none
  daysOfRestrictedWork: number;      // 0 means none
  daysOfJobTransfer: number;         // 0 means none
  receivedMedicalTreatment: boolean; // beyond first aid (if uncertain, list treatments below)
  firstAidTreatmentsOnly: FirstAidTreatment[]; // treatments received
  beyondFirstAidTreatments: BeyondFirstAidTreatment[]; // treatments received beyond first aid
  resultedInLossOfConsciousness: boolean;
  diagnosedSignificantInjury: boolean; // by a licensed health care professional

  // 1904.8 — needlestick/sharps
  isNeedlestickWithBloodOrOPIM: boolean;

  // 1904.10 — hearing loss
  isAudiogramConfirmedSTS: boolean;

  // 1904.11 — tuberculosis
  isWorkRelatedTBDiagnosis: boolean;
}

export interface RecordabilityResult {
  isRecordable: boolean;
  reason: string;
  cfr: string;
  decisionPath: DecisionStep[];
}

export interface DecisionStep {
  step: string;
  question: string;
  answer: boolean | string | number;
  determination: "CONTINUE" | "RECORDABLE" | "NOT_RECORDABLE";
  cfr: string;
  notes?: string;
}

// ─── Day Counting ─────────────────────────────────────────────────────────────

export interface DayCountInput {
  /** Date of injury or illness onset — day 0; counting begins the day after. 1904.7(b)(3)(i) */
  injuryDate: Date;
  /**
   * Each entry is one calendar day that the employee was away, restricted, or transferred.
   * The caller populates this from physician recommendations; compliance or non-compliance
   * by the employee is irrelevant. 1904.7(b)(3)(vi).
   */
  restrictedDays: Array<{ date: Date; type: "AWAY" | "RESTRICTED" | "TRANSFER" }>;
  /** If set, counting stops at this date (exclusive) due to return to full duty. */
  returnToFullDutyDate?: Date;
  /**
   * If set, counting stops at this date because the employee left employment for a reason
   * UNRELATED to the injury (retirement, resignation, etc.). 1904.7(b)(3)(iv).
   */
  leftForUnrelatedReasonDate?: Date;
}

export interface DayCountResult {
  /** Days away from work counted per 1904.7(b)(3), capped at 180. */
  daysAway: number;
  /** Days of restricted work or job transfer counted per 1904.7(b)(3), capped at 180. */
  daysRestricted: number;
  /** True if either count was truncated by the 180-day cap. 1904.7(b)(3)(v). */
  cappedAt180: boolean;
  /** The actual calendar dates counted, after applying all rules. */
  effectiveDays: Array<{ date: Date; type: "AWAY" | "RESTRICTED" | "TRANSFER" }>;
}

// ─── Privacy ─────────────────────────────────────────────────────────────────

export interface PrivacyCaseInput {
  privacyReason?: PrivacyReason;
  employeeRequestedPrivacy: boolean;
}

export interface PrivacyCaseResult {
  isPrivacyCase: boolean;
  reason?: PrivacyReason;
  cfr: string;
  logDisplayName: string; // "privacy case" or actual name depending on result
}

// ─── Exemption ───────────────────────────────────────────────────────────────

export interface ExemptionInput {
  /** Peak employee count at any point during the prior calendar year. 1904.1. */
  peakEmployeeCountPriorYear: number;
  /** The establishment's 4-6 digit NAICS code. */
  naicsCode: string;
}

export interface ExemptionResult {
  isExempt: boolean;
  reason?: "SMALL_EMPLOYER" | "LOW_HAZARD_INDUSTRY";
  cfr: string;
  notes: string;
  /** Even exempt employers must report severe injuries. 1904.1(a)(2), 1904.39. */
  mustStillReportSevereInjuries: boolean;
}

// ─── ITA Eligibility ──────────────────────────────────────────────────────────

export interface ITAEligibilityInput {
  /** Total employees employed at any time during the calendar year (FT+PT+seasonal+temp). 1904.41(b). */
  totalEmployeesInYear: number;
  naicsCode: string;
  /** The calendar year being evaluated (e.g. 2024). */
  reportingYear: number;
}

export type ITATier =
  | "NONE"        // No electronic submission required
  | "300A_ONLY"   // Must submit Form 300A
  | "ALL_FORMS";  // Must submit Forms 300A, 300, and 301

export interface ITAEligibilityResult {
  tier: ITATier;
  mustSubmit300A: boolean;
  mustSubmit300And301: boolean;
  reason: string;
  cfr: string;
  /** March 2 of the year after the reporting year. 1904.41(a)(2). */
  submissionDeadline: Date;
  /** Fields excluded from the 300/301 electronic submission per 1904.41(c). */
  excludedFields?: string[];
}

// ─── Severe Reporting ────────────────────────────────────────────────────────

export interface SevereReportingInput {
  severityLevel: SeverityLevel;
  /** Date/time of the incident. */
  incidentDateTime: Date;
  /** Date/time of the outcome (death, hospitalization, etc.). May differ from incident. */
  outcomeDateTime: Date;
  /** True if MVA on a public highway. 1904.39(b)(3). */
  isPublicHighwayMVA: boolean;
  /** True if incident on commercial transportation. 1904.39(b)(3). */
  isCommercialTransportation: boolean;
}

export interface SevereReportingResult {
  mustReport: boolean;
  reportingDeadlineFromDiscovery: {
    hours: 8 | 24;
    description: string;
  };
  cfr: string;
  notes: string;
  /** True if the time window between incident and outcome is within the triggering threshold. */
  withinTriggerWindow: boolean;
}

// ─── Classification ───────────────────────────────────────────────────────────

export interface ClassificationInput {
  resultedInDeath: boolean;
  daysAwayFromWork: number;
  daysOfRestrictedOrTransfer: number;
  /** Other recordable criteria: medical treatment, LOC, significant injury. */
  hasOtherRecordableCriteria: boolean;
}

export interface ClassificationResult {
  outcome: CaseOutcome;
  cfr: string;
  notes: string;
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export type WizardStepId =
  | "WORK_ENVIRONMENT"
  | "WORK_RELATEDNESS_EXCEPTIONS"
  | "NEW_CASE"
  | "DEATH"
  | "DAYS_AWAY"
  | "RESTRICTED_WORK_OR_TRANSFER"
  | "MEDICAL_TREATMENT_CHECK"
  | "FIRST_AID_ONLY_CHECK"
  | "LOSS_OF_CONSCIOUSNESS"
  | "SIGNIFICANT_INJURY_DIAGNOSIS"
  | "SPECIAL_CASES"
  | "RESULT";

export interface WizardStep {
  id: WizardStepId;
  question: string;
  cfr: string;
  hint?: string;
}

export interface WizardState {
  currentStep: WizardStepId;
  answers: Partial<RecordabilityInput>;
  completedSteps: WizardStepId[];
  result?: RecordabilityResult;
  isComplete: boolean;
}
