# Regulatory Logic — Exported Functions

Auto-generated from `packages/regulatory-logic/src/`. Do not edit manually.

---

## `packages/regulatory-logic/src/classification.ts`

- **`export function classifyOutcome(input: ClassificationInput): ClassificationResult {`** — Determines which 300 Log outcome column (G/H/I/J) to check, applying the most-serious-outcome rule. Per 1904.7(a): "If the case involves one or more of the following, you must record the case… You must enter the most serious outcome that applies." /
- **`export function describeCaseOutcome(outcome: CaseOutcome): string {`** — Returns a human-readable label for a CaseOutcome. /
- **`export function describeCaseType(caseType: CaseType): string {`** — Returns a human-readable label for a CaseType. /
- **`export function validateCaseTypeExclusivity(`** — Validates that M1–M6 exclusivity is maintained. Returns true if the caseType is valid given the claimed injury/illness nature. If isInjury is true, only CaseType.INJURY is valid. If isInjury is false (it's an illness), CaseType.INJURY is invalid. /

## `packages/regulatory-logic/src/day-counter.ts`

- **`export function countDays(input: DayCountInput): DayCountResult {`** — Counts days away from work and days of restricted work/job transfer for an OSHA 300 Log entry. The caller provides the list of restricted days (from physician recommendation), keyed by calendar date and type. This function applies all regulatory rules and returns the final counts for columns K and L of the 300 Log. /
- **`export function generateContinuousDays(`** — Generates a sequence of calendar day entries for a simple continuous absence. Useful for constructing DayCountInput when the employer knows "out from date A through date B." Does NOT apply any regulatory rules — that is done by countDays(). /
- **`export function remainingDaysUnderCap(currentDaysAway: number, currentDaysRestricted: numb…`** — Returns how many calendar days remain before the 180-day cap is reached. /

## `packages/regulatory-logic/src/exemption.ts`

- **`export function checkExemption(input: ExemptionInput): ExemptionResult {`** — Determines whether an establishment is exempt from routine OSHA recordkeeping. NOTE: Exemption from recordkeeping does NOT mean exemption from severe-injury reporting under 1904.39. mustStillReportSevereInjuries is always true. /

## `packages/regulatory-logic/src/first-aid.ts`

- **`export interface MedicalTreatmentEvaluation {`**
- **`export function evaluateMedicalTreatment(`** — Evaluates whether the treatments received constitute "medical treatment beyond first aid" under 29 CFR 1904.7(b)(5)(ii). Note: A case may have BOTH first-aid and beyond-first-aid treatments. The presence of ANY beyond-first-aid treatment makes this criterion true. /
- **`export function describeFirstAidTreatment(t: FirstAidTreatment): string {`** — Returns the regulatory label for a first-aid treatment.
- **`export function describeBeyondFirstAidTreatment(t: BeyondFirstAidTreatment): string {`** — Returns the regulatory label for a beyond-first-aid treatment.
- **`export const ALL_FIRST_AID_TREATMENTS = Object.values(FirstAidTreatment);`** — The complete set of first-aid treatments per 1904.7(b)(5)(ii).

## `packages/regulatory-logic/src/ita-eligibility.ts`

- **`export const EXCLUDED_FIELDS_300 = ["Employee name (column B)"] as const;`** — Fields excluded from the 300 Log electronic submission. 1904.41(c)(1). /
- **`export const EXCLUDED_FIELDS_301 = [`** — Fields excluded from the 301 Incident Report electronic submission. 1904.41(c)(2). /
- **`export function computeITADeadline(reportingYear: number): Date {`** — Computes the March 2 submission deadline for a given reporting year. 1904.41(a)(2). e.g., for reporting year 2024, the deadline is March 2, 2025. /
- **`export function checkITAEligibility(`** — Determines whether an establishment must electronically submit OSHA injury/illness data to OSHA's Injury Tracking Application, and which forms are required. /

## `packages/regulatory-logic/src/naics-data.ts`

- **`export interface NaicsEntry {`**
- **`export const APPENDIX_A_SUBPART_B_EXEMPT: NaicsEntry[] = [`**
- **`export const APPENDIX_B_SUBPART_E_300_301: NaicsEntry[] = [`**
- **`export function isAppendixASubpartBExempt(naicsCode: string): boolean {`** — Returns true if the NAICS code (or any parent prefix) is in Appendix A to Subpart B (the low-hazard exempt industry list). Uses prefix matching to handle 5- and 6-digit sub-codes that descend from a listed 4-digit code. /
- **`export function isAppendixBSubpartE300_301(naicsCode: string): boolean {`** — Returns true if the NAICS code (or any parent prefix) is in Appendix B to Subpart E (the 100+ employee industries requiring 300/301 electronic submission). /
- **`export function getNaicsTitle(naicsCode: string): string | undefined {`** — Returns the title for a NAICS code from either appendix, or undefined if not found. /

## `packages/regulatory-logic/src/privacy.ts`

- **`export function evaluatePrivacyCase(input: PrivacyCaseInput): PrivacyCaseResult {`** — Evaluates whether a case must be treated as a privacy concern case per 1904.29(b)(7). If it is a privacy case: - Enter "privacy case" on the 300 Log in place of the employee's name. - Maintain a separate confidential list linking the case number to the employee's identity. - The 301 Incident Report retains the employee's name (for government access per 1904.40). /
- **`export function describePrivacyReason(reason: PrivacyReason): string {`** — Returns the regulatory description for a privacy reason. /
- **`export function getAllPrivacyReasons(): Array<{`** — Returns all privacy reasons and their descriptions. Useful for building UI picker or COMPLIANCE.md documentation. Per 1904.29(b)(8) this is a complete and exhaustive list. /
- **`export function sanitizePrivacyCaseDescription(`** — Generates safe description text for a privacy case on the 300 Log, per 1904.29(b)(9). The description must still identify the cause and general severity without identifying the employee. @param originalDescription  The full description as entered on the 301 form. @param reason               The privacy reason that applies. @returns A redacted description suitable for the 300 Log's public-facing columns. /

## `packages/regulatory-logic/src/recordability.ts`

- **`export function evaluateRecordability(`** — Evaluates whether a case is OSHA recordable. Returns a full decision path so the result can be audited and displayed in the recordability wizard. /

## `packages/regulatory-logic/src/severe-reporting.ts`

- **`export function checkSevereReporting(`** — Determines whether a severe injury, illness, or fatality must be reported to OSHA and computes the reporting deadline. /
- **`export function computeReportingDeadline(`** — Computes the absolute reporting deadline given when the employer learned of the event. /

## `packages/regulatory-logic/src/types.ts`

- **`export enum CaseOutcome {`** — 300 Log columns G–J (mutually exclusive; most-serious-outcome rule). 1904.7(a).
- **`export enum CaseType {`** — 300 Log columns M1–M6 (injury vs. illness mutually exclusive). 1904.7(a).
- **`export enum PrivacyReason {`** — Complete enumeration per 1904.29(b)(7) — 1904.29(b)(8) states this list is exhaustive.
- **`export enum SeverityLevel {`** — Severe injury/illness types triggering mandatory OSHA reporting. 1904.39.
- **`export enum WorkRelatednessException {`** — Exceptions to the presumption of work-relatedness. 1904.5(b)(2). If any exception applies, the injury/illness is NOT work-related. /
- **`export enum FirstAidTreatment {`** — Complete list of first-aid treatments from 1904.7(b)(5)(ii). Treatments in this list are NOT "medical treatment beyond first aid" and therefore do not alone make a case recordable. /
- **`export enum BeyondFirstAidTreatment {`** — Medical treatments that ARE "beyond first aid" — receiving any makes case recordable if work-related.
- **`export interface RecordabilityInput {`**
- **`export interface RecordabilityResult {`**
- **`export interface DecisionStep {`**
- **`export interface DayCountInput {`**
- **`export interface DayCountResult {`**
- **`export interface PrivacyCaseInput {`**
- **`export interface PrivacyCaseResult {`**
- **`export interface ExemptionInput {`**
- **`export interface ExemptionResult {`**
- **`export interface ITAEligibilityInput {`**
- **`export type ITATier =`**
- **`export interface ITAEligibilityResult {`**
- **`export interface SevereReportingInput {`**
- **`export interface SevereReportingResult {`**
- **`export interface ClassificationInput {`**
- **`export interface ClassificationResult {`**
- **`export type WizardStepId =`**
- **`export interface WizardStep {`**
- **`export interface WizardState {`**

## `packages/regulatory-logic/src/wizard.ts`

- **`export const WIZARD_STEPS: WizardStep[] = [`**
- **`export function getWizardStepIds(): WizardStepId[] {`** — Returns the ordered list of step IDs for the wizard.
- **`export function getWizardStep(id: WizardStepId): WizardStep | undefined {`** — Returns a step definition by ID.
- **`export function createWizard(): WizardState {`** — Creates the initial wizard state with no answers. /
- **`export function advanceWizard(`** — Advances the wizard with an answer to the current step. The wizard uses short-circuit logic: as soon as a NOT_RECORDABLE or RECORDABLE determination can be made, it jumps to the RESULT step and computes the final answer. @param state   Current wizard state (not mutated) @param answer  The user's answer to the current step question @returns       New wizard state after processing the answer /

## `packages/regulatory-logic/src/work-relatedness.ts`

- **`export interface WorkRelatednessInput {`**
- **`export interface WorkRelatednessResult {`**
- **`export function determineWorkRelatedness(`** — Determines whether an injury or illness is work-related under 29 CFR 1904.5. /
- **`export function describeException(e: WorkRelatednessException): string {`** — Human-readable description of a work-relatedness exception.

