# Compliance Mapping — 29 CFR Part 1904

This document maps every implemented rule in 29 CFR Part 1904 to the specific file and function that enforces it. Intended for safety auditors and legal reviewers.

---

## 1904.1 — Partial Exemption for Employers with 10 or Fewer Employees

**Rule:** Employers that had 10 or fewer employees at all times during the previous calendar year are exempt from most Part 1904 recording requirements. They must still report severe injuries and fatalities under 1904.39.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/exemption.ts` → `checkExemption()` | Checks `employeeCount ≤ 10`; returns `exempt: true` with `reason: "SMALL_EMPLOYER"` |
| `apps/web/src/server/routers/establishments.ts` | Surfaces exemption status in the UI |

**Always set regardless of exemption:** `mustStillReportSevereInjuries: true` — enforced in `checkExemption()`.

---

## 1904.2 — Partial Exemption for Establishments in Certain Industries

**Rule:** Establishments in certain low-hazard industries (Appendix A to Subpart B of Part 1904) are exempt from keeping a 300 Log and 301 forms. They must still report under 1904.39.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/exemption.ts` → `checkExemption()` | After small-employer check, calls `isAppendixASubpartBExempt(naicsCode)` |
| `packages/regulatory-logic/src/naics-data.ts` → `APPENDIX_A_SUBPART_B_EXEMPT` | Array of 82 NAICS codes from the official appendix; prefix matching used |
| `packages/regulatory-logic/src/naics-data.ts` → `isAppendixASubpartBExempt()` | Returns true if code or any prefix matches |
| `packages/db/prisma/seed.ts` | Seeds all 189 NAICS codes into `naics_codes` table for lookup |

---

## 1904.4 — Recording Criteria (General)

**Rule:** Each employer must record each fatality, injury, or illness that is work-related, is a new case, and meets one or more of the general recording criteria in 1904.7.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/recordability.ts` → `evaluateRecordability()` | Three-part test: (1) work-related, (2) new case, (3) general criteria |
| Returns `DecisionStep[]` path | Audit trail of the reasoning, with CFR citation at each step |

---

## 1904.5 — Determination of Work-Relatedness

**Rule:** An injury or illness is work-related if an event or exposure in the work environment caused or contributed to the condition, or significantly aggravated a pre-existing condition. The work environment is the establishment and other locations where employees work.

### 1904.5(b)(2) — Nine Exceptions to Work-Relatedness

| Exception | Where Implemented |
|-----------|------------------|
| (i) Present as a member of the general public | `work-relatedness.ts` → `WorkRelatednessException.GENERAL_PUBLIC` |
| (ii) Pre-existing condition | `work-relatedness.ts` → `WorkRelatednessException.PRE_EXISTING` |
| (iii) Voluntary participation (wellness/fitness) | `work-relatedness.ts` → `WorkRelatednessException.VOLUNTARY_WELLNESS` |
| (iv) Personal task outside assigned hours | `work-relatedness.ts` → `WorkRelatednessException.PERSONAL_TASK` |
| (v) Personal grooming/self-medication | `work-relatedness.ts` → `WorkRelatednessException.PERSONAL_GROOMING` |
| (vi) Motor vehicle accident in parking lot/access road | `work-relatedness.ts` → `WorkRelatednessException.PARKING_LOT_MVA` |
| (vii) Common cold or flu | `work-relatedness.ts` → `WorkRelatednessException.COMMON_COLD_FLU` |
| (viii) Mental illness (unless LHCP opinion) | `work-relatedness.ts` → `WorkRelatednessException.MENTAL_ILLNESS` |
| (ix) Solely caused by employee eating/drinking | `work-relatedness.ts` → `WorkRelatednessException.EATING_DRINKING` |

All nine exceptions: `packages/regulatory-logic/src/work-relatedness.ts` → `determineWorkRelatedness()`

---

## 1904.6 — Determination of New Cases

**Rule:** An employer must consider an injury or illness to be a "new case" if the employee has not previously experienced a recorded injury or illness of the same type that affects the same part of the body; or the employee previously experienced a recorded injury or illness of the same type, recovered completely, and a new event or exposure caused the condition.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/recordability.ts` | Second step in `evaluateRecordability()` — checks `isNewCase` flag |
| `apps/web/src/app/(app)/cases/new/page.tsx` | Wizard step `NEW_CASE` prompts user for this determination |

---

## 1904.7 — General Recording Criteria

**Rule:** An injury or illness meets one or more of seven general criteria: death; days away from work; restricted work or job transfer; medical treatment beyond first aid; loss of consciousness; significant injury or illness diagnosed by LHCP.

### 1904.7(a) — Criteria Overview

| Criterion | Where Implemented |
|-----------|------------------|
| Death (G) | `recordability.ts` → `CaseOutcome.DEATH` |
| Days away from work (H) | `recordability.ts` → `CaseOutcome.DAYS_AWAY` |
| Restricted work / job transfer (I) | `recordability.ts` → `CaseOutcome.RESTRICTED_TRANSFER` |
| Other recordable (J) | `recordability.ts` → `CaseOutcome.OTHER_RECORDABLE` |
| Medical treatment beyond first aid | `first-aid.ts` → `evaluateMedicalTreatment()` |
| Loss of consciousness | `recordability.ts` → wizard step `LOSS_OF_CONSCIOUSNESS` |
| Significant injury or illness | `recordability.ts` → wizard step `SIGNIFICANT_INJURY` |

### 1904.7(b)(3) — Day-Counting Rules

| Rule | Where Implemented |
|------|------------------|
| Count begins the day after injury/illness onset | `packages/regulatory-logic/src/day-counter.ts` → `countDays()` |
| Calendar days (not work days) | `day-counter.ts` — uses `differenceInCalendarDays` |
| 180-day cap for days away and restricted | `day-counter.ts` — `Math.min(count, 180)` |
| Days away and restricted are mutually exclusive for the same calendar day | `day-counter.ts` — AWAY wins when both present on same date |
| Count stops when employee returns to full duty | `day-counter.ts` — checks `returnToFullDuty` date |
| Count stops when unrelated reason ends employment | `day-counter.ts` — checks `unrelatedReasonEnded` flag |

### 1904.7(b)(5)(ii) — First-Aid Exclusion List (14 items)

All 14 items enumerated in 1904.7(b)(5)(ii)(A)–(N) are implemented as individual enum values:

| CFR Item | `FirstAidTreatment` Enum Value |
|---------|-------------------------------|
| (A) Nonprescription medications at nonprescription strength | `NONPRESCRIPTION_MEDICATION` |
| (B) Tetanus immunizations | `TETANUS_IMMUNIZATION` |
| (C) Cleaning, flushing, soaking surface wounds | `WOUND_CLEANING` |
| (D) Wound coverings / butterfly bandages | `WOUND_COVERING` |
| (E) Hot/cold therapy | `HOT_COLD_THERAPY` |
| (F) Non-rigid means of support | `NON_RIGID_SUPPORT` |
| (G) Temporary immobilization during transport | `TEMPORARY_IMMOBILIZATION` |
| (H) Drilling of fingernail/toenail for subungual hematoma | `NAIL_DRILLING` |
| (I) Eye patches | `EYE_PATCH` |
| (J) Removing foreign bodies from eye with irrigation | `EYE_IRRIGATION` |
| (K) Removing splinters/foreign material with tweezers etc. | `SPLINTER_REMOVAL` |
| (L) Finger guards | `FINGER_GUARD` |
| (M) Massages | `MASSAGE` |
| (N) Drinking fluids for relief of heat stress | `HEAT_STRESS_FLUIDS` |

Implemented in: `packages/regulatory-logic/src/first-aid.ts` → `evaluateMedicalTreatment()` and `packages/regulatory-logic/src/types.ts` → `FirstAidTreatment` enum.

---

## 1904.10 — Recording Criteria for Cases Involving Occupational Hearing Loss

**Rule:** Record a work-related hearing loss case when an employee's hearing test reveals a Standard Threshold Shift (STS) of 10 dB or more averaged at 2000, 3000, and 4000 Hz in one or both ears, and the employee's total hearing level is 25 dB or more above audiometric zero in the same ear(s).

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/recordability.ts` | Wizard step `HEARING_LOSS_THRESHOLD` |
| `packages/regulatory-logic/src/types.ts` → `CaseType.HEARING_LOSS` | Column M5 on 300 Log |

---

## 1904.29 — Forms

### 1904.29(b)(6) — Privacy Case Protection

**Rule:** For certain sensitive cases, the employer must not enter the employee's name on the 300 Log; instead the employer must enter "privacy case" in the name column. The employer must keep a separate, confidential list of case numbers and employee names for privacy cases.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/privacy.ts` → `evaluatePrivacyCase()` | Determines if case qualifies as privacy |
| `apps/web/src/server/routers/cases.ts` → `applyPrivacyMask()` | Replaces `employeeName` with `"privacy case"` on all reads |
| `apps/web/src/server/routers/forms.ts` → `get300Log` | Always substitutes `"privacy case"` regardless of user role |
| `apps/web/src/server/routers/cases.ts` → `getPrivacyRoster` | Admin-only confidential roster per 1904.29(b)(6) |
| `apps/web/src/server/routers/audit.ts` | `VIEW_PRIVACY` audit event logged on every privacy case access |

### 1904.29(b)(7) — Six Privacy Case Reasons (Exhaustive List)

| CFR Section | Reason | `PrivacyReason` Enum |
|------------|--------|---------------------|
| (b)(7)(i) | Intimate body part or reproductive system | `INTIMATE_BODY_PART` |
| (b)(7)(ii) | Sexual assault | `SEXUAL_ASSAULT` |
| (b)(7)(iii) | Mental illness | `MENTAL_ILLNESS` |
| (b)(7)(iv) | HIV infection, hepatitis, tuberculosis | `HIV_HEPATITIS_TB` |
| (b)(7)(v) | Needlestick or sharps with blood/OPIM | `NEEDLESTICK` |
| (b)(7)(vi) | Employee voluntarily requests | `EMPLOYEE_REQUEST` |

Implemented in: `packages/regulatory-logic/src/privacy.ts` → `getAllPrivacyReasons()` and `packages/regulatory-logic/src/types.ts` → `PrivacyReason` enum.

### 1904.29(b)(8)–(9) — Description Sanitization

**Rule:** For privacy cases, the employer may use a general description in the "Describe injury" column if more specific information would identify the employee.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/privacy.ts` → `sanitizePrivacyCaseDescription()` | Returns generic description |
| `apps/web/src/server/routers/forms.ts` → `get300Log` | Applies sanitized description on 300 Log output |

---

## 1904.32 — Annual Summary

### 1904.32(a) — Summary Totals

**Rule:** At the end of each calendar year, the employer must review the 300 Log, verify the entries, and summarize the information on Form 300A.

| Where Implemented | Detail |
|------------------|--------|
| `apps/web/src/server/routers/forms.ts` → `get300A` | Computes all 12 totals (G–M6) from 300 Log data |
| `apps/web/src/app/(app)/forms/300a/[yearId]/page.tsx` | 300A display page with totals table |

### 1904.32(b)(3) — Certification by Company Executive

**Rule:** A company executive must certify the annual summary. The certifying executive must be: an owner, officer, director of a corporation, partner of a partnership, associate of a sole proprietorship, or the highest-ranking company official working at the establishment.

| Where Implemented | Detail |
|------------------|--------|
| `apps/web/src/server/routers/reportingYears.ts` → `certify300A` | `executiveProcedure` — only EXECUTIVE or ADMIN role allowed |
| `packages/db/prisma/schema.prisma` → `CertificationRecord` model | Stores signer name, title, timestamp |

### 1904.32(b)(6) — Posting Requirement (February 1 – April 30)

**Rule:** The employer must post a copy of the annual summary in each establishment in a conspicuous place where notices to employees are customarily posted from February 1 to April 30 of the year following the calendar year covered by the records.

| Where Implemented | Detail |
|------------------|--------|
| `apps/web/src/app/(app)/forms/300a/[yearId]/page.tsx` | Orange warning banner citing 1904.32(b)(6) |
| `apps/web/src/lib/pdf/form300a.tsx` → `Form300APdf` | Posting requirement printed on every 300A PDF |
| `apps/web/src/server/routers/forms.ts` → `get300A` | Returns `postingRequirement` with start/end dates |

---

## 1904.33 — Retention and Updating

**Rule:** The employer must save the 300 Log, the privacy case list, the annual summary, and the 301 incident reports for 5 years following the end of the calendar year that these records cover. The employer must update stored 300 Logs to include newly discovered recordable injuries or illnesses and to show changes that have occurred in previously recorded cases.

| Where Implemented | Detail |
|------------------|--------|
| `apps/web/src/server/routers/reportingYears.ts` → `delete` | Throws `FORBIDDEN` if year is within 5-year retention window |
| `apps/web/src/server/routers/reportingYears.ts` → `retentionStatus` | Returns `withinRetentionWindow`, `retentionExpiresAt` |
| `apps/web/src/app/(app)/archive/page.tsx` | Archive page shows retention status per year |
| `apps/web/src/server/routers/cases.ts` → `delete` | Soft delete (sets `isRecordable: false`); never destroys rows |
| `apps/web/src/server/routers/cases.ts` → `update` | Requires `reason` field for every update; reason stored in audit log |
| `apps/web/src/server/routers/audit.ts` | Append-only audit log — never deleted |

---

## 1904.39 — Reporting Fatalities, Hospitalizations, Amputations, and Losses of an Eye

### 1904.39(a)(1) — Fatality Reporting (8 hours)

**Rule:** Within 8 hours after the death of any employee from a work-related incident, the employer must orally report the fatality to the OSHA Area Office nearest the location of the incident, or to OSHA's 24-hour hotline (1-800-321-OSHA).

### 1904.39(a)(2) — Severe Injury Reporting (24 hours)

**Rule:** Within 24 hours after the in-patient hospitalization of one or more employees, or an employee's amputation, or an employee's loss of an eye, as a result of a work-related incident, the employer must orally report the event to OSHA.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/severe-reporting.ts` → `checkSevereReporting()` | Checks outcome type and elapsed time |
| `packages/regulatory-logic/src/severe-reporting.ts` → `computeReportingDeadline()` | Returns exact deadline timestamp |
| `packages/regulatory-logic/src/types.ts` → `SeverityLevel` enum | `FATALITY`, `HOSPITALIZATION`, `AMPUTATION`, `EYE_LOSS` |
| `apps/web/src/app/(app)/cases/new/page.tsx` | Red 1904.39 alert banner shown when severe injury detected |
| `apps/web/src/lib/pdf/form301.tsx` | Severe injury notice printed on Form 301 PDF |

### 1904.39(b)(4)–(5) — Motor Vehicle and Commercial Transportation Exceptions

**Rule:** Fatalities or injuries in motor vehicle accidents on public streets or highways or in commercial transportation accidents are not reportable unless they occurred on a company construction worksite.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/severe-reporting.ts` → `checkSevereReporting()` | Checks `mvaOnPublicRoad` and `commercialTransport` flags |

---

## 1904.40 — Providing Records to Government Representatives

**Rule:** When an authorized government representative asks for the records kept under Part 1904, the employer must provide copies of the records by the end of the next business day.

| Where Implemented | Detail |
|------------------|--------|
| `apps/web/src/server/routers/audit.ts` | All form accesses logged; available for government review |
| `apps/web/src/server/routers/cases.ts` → `getPrivacyRoster` | Privacy roster accessible to ADMIN role |
| `apps/web/src/server/routers/export.ts` → `jsonBackup` | Full establishment-year export for government provision |

---

## 1904.41 — Electronic Submission of Injury and Illness Records to OSHA

### Eligibility Tiers

| Tier | Condition | Required Submission | Where Implemented |
|------|----------|--------------------|--------------------|
| Tier 3 | 100+ employees **and** NAICS in Appendix B to Subpart E | Form 300A + Form 300 + Form 301 data | `ita-eligibility.ts` → `ALL_FORMS` |
| Tier 1 | 250+ employees **any industry** | Form 300A only | `ita-eligibility.ts` → `300A_ONLY` |
| Tier 2 | 20–249 employees **and** NAICS in Appendix A to Subpart E | Form 300A only (flag) | `ita-eligibility.ts` → flag |
| None | Otherwise | Not required | `ita-eligibility.ts` → `NONE` |

**Note:** Tier 3 is checked before Tier 1. An establishment with 100+ employees in an Appendix B industry must submit ALL_FORMS, not just 300A_ONLY.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/ita-eligibility.ts` → `checkITAEligibility()` | All tier logic |
| `packages/regulatory-logic/src/ita-eligibility.ts` → `computeITADeadline()` | Returns March 2 of year following reporting year |
| `packages/regulatory-logic/src/naics-data.ts` → `APPENDIX_B_SUBPART_E_300_301` | 107 Appendix B NAICS codes |
| `apps/web/src/server/routers/itaCheck.ts` | tRPC procedure wrapping `checkITAEligibility` |
| `apps/web/src/app/(app)/forms/300a/[yearId]/page.tsx` | ITA card showing tier, required forms, deadline |

### 1904.41(c) — Field Exclusions for Electronic Submission

**Rule:** Employers must not submit employee name, address, date of birth, date of hire, name of physician/LHCP, or treatment facility for Forms 300 and 301 submitted electronically.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/ita-eligibility.ts` → `EXCLUDED_FIELDS_300` | Fields excluded from Form 300 submission |
| `packages/regulatory-logic/src/ita-eligibility.ts` → `EXCLUDED_FIELDS_301` | Fields excluded from Form 301 submission |
| `apps/web/src/server/routers/export.ts` → `csvITA300And301` | Applies exclusions when building ITA CSV |

### Annual Deadline

**Rule:** Submissions are due by March 2 of the year following the calendar year covered by the records.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/ita-eligibility.ts` → `computeITADeadline()` | Returns `${year+1}-03-02` |

---

## Appendix A to Subpart B — Partially Exempt Industries

82 NAICS codes of low-hazard industries exempt from 300/301 recordkeeping requirements.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/naics-data.ts` → `APPENDIX_A_SUBPART_B_EXEMPT` | Array of 82 codes |
| `packages/regulatory-logic/src/naics-data.ts` → `isAppendixASubpartBExempt()` | Prefix-match lookup |

---

## Appendix B to Subpart E — High-Hazard Industries for ITA Tier 3

107 NAICS codes of high-hazard industries where establishments with 100+ employees must submit Forms 300 and 301 data electronically.

| Where Implemented | Detail |
|------------------|--------|
| `packages/regulatory-logic/src/naics-data.ts` → `APPENDIX_B_SUBPART_E_300_301` | Array of 107 codes |
| `packages/regulatory-logic/src/naics-data.ts` → `isAppendixBSubpartE300_301()` | Prefix-match lookup |

---

## What Is NOT Automated

The following compliance activities require manual action by the employer:

| Activity | Why Manual |
|----------|-----------|
| **ITA electronic submission** | Must be submitted through OSHA's Injury Tracking Application at https://www.osha.gov/injuryreporting — this system prepares the data and exports the CSV, but cannot submit directly |
| **Oral fatality/severe injury reporting to OSHA** | 1904.39 requires an oral report by phone; this system shows the deadline and the hotline number (1-800-321-OSHA) but cannot place the call |
| **State Plan jurisdiction determination** | 29 states and territories operate their own OSHA-approved State Plans with potentially stricter rules; this system implements federal OSHA standards only |
| **Annual summary posting** | Physical posting in the workplace from February 1 – April 30 is required; the system provides a printable/downloadable 300A PDF but cannot post it |
| **Government record requests** | Records must be provided to authorized government representatives by the next business day; this system makes records exportable but cannot transmit them automatically |
