# Recordability Decision Wizard

This document describes the 12-step recordability decision tree implemented in `packages/regulatory-logic/src/wizard.ts` and `packages/regulatory-logic/src/recordability.ts`, citing the exact CFR sections at each step.

---

## Decision Flowchart

```mermaid
flowchart TD
    START([New incident reported]) --> S1

    S1["Step 1: WORK_ENVIRONMENT\nDid the injury/illness occur in\nthe work environment?\n1904.5(a)"]
    S1 -->|No| NOT_RECORDABLE1([Not recordable — not in work environment])
    S1 -->|Yes| S2

    S2["Step 2: WORK_RELATED_EXCEPTION\nDoes one of the 9 exceptions\nto work-relatedness apply?\n1904.5(b)(2)"]
    S2 -->|Yes — exception applies| NOT_RECORDABLE2([Not recordable — exception applies])
    S2 -->|No exception| S3

    S3["Step 3: NEW_CASE\nIs this a new case?\n(Not a recurrence of a\npreviously recorded case)\n1904.6"]
    S3 -->|No — recurrence| NOT_RECORDABLE3([Not recordable — recurrence of prior case])
    S3 -->|Yes — new case| S4

    S4["Step 4: RESULTED_IN_DEATH\nDid the incident result\nin the employee's death?\n1904.7(a)(1)"]
    S4 -->|Yes| RECORDABLE_DEATH([RECORDABLE — Death\nOutcome G · 1904.7(a)(1)])
    S4 -->|No| S5

    S5["Step 5: RESULTED_IN_DAYS_AWAY\nDid the employee miss any\nscheduled work days?\n1904.7(a)(2)"]
    S5 -->|Yes| RECORDABLE_DAYS([RECORDABLE — Days Away From Work\nOutcome H · 1904.7(a)(2)\nCount days per 1904.7(b)(3)])
    S5 -->|No| S6

    S6["Step 6: RESULTED_IN_RESTRICTED\nDid the employee have restricted\nwork or job transfer?\n1904.7(a)(3)"]
    S6 -->|Yes| RECORDABLE_RESTRICTED([RECORDABLE — Restricted/Transfer\nOutcome I · 1904.7(a)(3)])
    S6 -->|No| S7

    S7["Step 7: RESULTED_IN_OTHER_RECORDABLE\nWas any other OSHA recordable\noutcome checked?\n1904.7(a)(4)–(7)"]
    S7 -->|Yes| S8
    S7 -->|No| NOT_RECORDABLE4([Not recordable — no criteria met])

    S8["Step 8: MEDICAL_TREATMENT\nDid the employee receive medical\ntreatment beyond first aid?\n1904.7(a)(4) + 1904.7(b)(5)"]
    S8 -->|Yes — beyond first aid| RECORDABLE_MEDICAL([RECORDABLE — Medical Treatment\nOutcome J · 1904.7(a)(4)])
    S8 -->|No — first aid only| S9

    S9["Step 9: SIGNIFICANT_INJURY\nWas a significant injury or illness\ndiagnosed by a licensed health care\nprofessional (LHCP)?\n1904.7(a)(6)"]
    S9 -->|Yes| RECORDABLE_SIGNIFICANT([RECORDABLE — Significant Injury/Illness\nOutcome J · 1904.7(a)(6)])
    S9 -->|No| S10

    S10["Step 10: LOSS_OF_CONSCIOUSNESS\nDid the employee lose\nconsciousness?\n1904.7(a)(5)"]
    S10 -->|Yes| RECORDABLE_LOSS([RECORDABLE — Loss of Consciousness\nOutcome J · 1904.7(a)(5)])
    S10 -->|No| S11

    S11["Step 11: HEARING_LOSS_THRESHOLD\nDoes the case involve an STS\n≥10 dB at 2000/3000/4000 Hz\nwith total level ≥25 dB?\n1904.10"]
    S11 -->|Yes| RECORDABLE_HEARING([RECORDABLE — Hearing Loss\nOutcome J · 1904.10\nCase Type M5])
    S11 -->|No| NOT_RECORDABLE5([Not recordable — criteria not met])

    RECORDABLE_DEATH --> S12
    RECORDABLE_DAYS --> S12
    RECORDABLE_RESTRICTED --> S12
    RECORDABLE_MEDICAL --> S12
    RECORDABLE_SIGNIFICANT --> S12
    RECORDABLE_LOSS --> S12
    RECORDABLE_HEARING --> S12

    S12["Step 12: FINAL_DECISION\nPrivacy case check\n1904.29(b)(7)–(9)\nIs this a privacy case?"]
    S12 -->|Yes — one of 6 reasons| PRIVACY([Record as Privacy Case\nEnter 'privacy case' on 300 Log\nStore real name in confidential roster])
    S12 -->|No| NORMAL([Record normally\nEnter employee name on 300 Log])
```

---

## Step-by-Step Prose

### Step 1 — Work Environment (`WORK_ENVIRONMENT`)
**CFR:** 29 CFR 1904.5(a)

The work environment includes the employer's establishment and other locations where employees are working. An injury or illness must have occurred in the work environment to proceed.

**Implementation:** `packages/regulatory-logic/src/wizard.ts`, step `WORK_ENVIRONMENT`; `packages/regulatory-logic/src/work-relatedness.ts` → `determineWorkRelatedness()`

---

### Step 2 — Work-Relatedness Exception (`WORK_RELATED_EXCEPTION`)
**CFR:** 29 CFR 1904.5(b)(2)

Even if the incident occurred in the work environment, it is NOT work-related if one of nine specific exceptions applies:

| # | Exception | CFR |
|---|-----------|-----|
| 1 | Employee was present as a member of the general public | 1904.5(b)(2)(i) |
| 2 | Symptoms from a pre-existing condition (not aggravated by work) | 1904.5(b)(2)(ii) |
| 3 | Voluntary participation in wellness program, fitness activity, medical exam | 1904.5(b)(2)(iii) |
| 4 | Personal task outside assigned working hours | 1904.5(b)(2)(iv) |
| 5 | Personal grooming, self-medication, or personal hygiene | 1904.5(b)(2)(v) |
| 6 | Motor vehicle accident in establishment parking lot or access road (not in performance of work) | 1904.5(b)(2)(vi) |
| 7 | Common cold or flu | 1904.5(b)(2)(vii) |
| 8 | Mental illness (unless confirmed work-related by LHCP opinion) | 1904.5(b)(2)(viii) |
| 9 | Solely caused by employee eating, drinking, or preparing food for personal consumption | 1904.5(b)(2)(ix) |

**Implementation:** `packages/regulatory-logic/src/work-relatedness.ts` → `determineWorkRelatedness()` and `packages/regulatory-logic/src/types.ts` → `WorkRelatednessException` enum

---

### Step 3 — New Case (`NEW_CASE`)
**CFR:** 29 CFR 1904.6

An injury or illness is a new case if:
- The employee has not previously experienced a recorded injury or illness of the same type that affects the same body part, **OR**
- The employee previously experienced the same injury or illness, recovered completely, and a new event or exposure caused the condition.

**Implementation:** `packages/regulatory-logic/src/recordability.ts`, second step in `evaluateRecordability()`

---

### Step 4 — Death (`RESULTED_IN_DEATH`)
**CFR:** 29 CFR 1904.7(a)(1)

If the work-related injury or illness results in the employee's death, it is **recordable as outcome G**. Additionally, per 1904.39(a)(1), the employer must orally report the fatality to OSHA within **8 hours**.

**Implementation:** `packages/regulatory-logic/src/classification.ts` → `CaseOutcome.DEATH`; `packages/regulatory-logic/src/severe-reporting.ts` → `checkSevereReporting()`

---

### Step 5 — Days Away From Work (`RESULTED_IN_DAYS_AWAY`)
**CFR:** 29 CFR 1904.7(a)(2)

If the injury or illness results in the employee missing any scheduled work days (beyond the day of injury), it is **recordable as outcome H**.

**Day counting (1904.7(b)(3)):**
- Count begins the **day after** the injury or illness onset
- Count **calendar days**, not workdays
- Cap at **180 days**
- Count stops when the employee returns to full duty or is terminated for an unrelated reason
- Days away and days restricted are **mutually exclusive** per calendar day — if both, AWAY takes precedence (more serious)

**Implementation:** `packages/regulatory-logic/src/day-counter.ts` → `countDays()`

---

### Step 6 — Restricted Work or Job Transfer (`RESULTED_IN_RESTRICTED`)
**CFR:** 29 CFR 1904.7(a)(3)

If the injury or illness results in restricted work activity or job transfer — but no days away — it is **recordable as outcome I**.

**Implementation:** `packages/regulatory-logic/src/classification.ts` → `CaseOutcome.RESTRICTED_TRANSFER`

---

### Step 7 — Other Recordable Outcomes (`RESULTED_IN_OTHER_RECORDABLE`)
**CFR:** 29 CFR 1904.7(a)(4)–(7)

If none of the above outcomes apply but the case may still be recordable under:
- Medical treatment beyond first aid (1904.7(a)(4))
- Loss of consciousness (1904.7(a)(5))
- Significant injury or illness by LHCP diagnosis (1904.7(a)(6))
- Hearing loss threshold (1904.10)

Proceed to Steps 8–11.

---

### Step 8 — Medical Treatment Beyond First Aid (`MEDICAL_TREATMENT`)
**CFR:** 29 CFR 1904.7(a)(4) + 1904.7(b)(5)

Medical treatment **beyond first aid** makes the case recordable as outcome J. First aid is defined in 1904.7(b)(5)(ii) as a specific enumerated list of 14 treatments; anything not on that list is considered medical treatment beyond first aid.

The 14 first-aid items (A through N) are implemented as the `FirstAidTreatment` enum. See [COMPLIANCE.md](../COMPLIANCE.md#19047b5ii--first-aid-exclusion-list-14-items) for the full mapping.

**Implementation:** `packages/regulatory-logic/src/first-aid.ts` → `evaluateMedicalTreatment()`

---

### Step 9 — Significant Injury or Illness (`SIGNIFICANT_INJURY`)
**CFR:** 29 CFR 1904.7(a)(6)

A significant injury or illness diagnosed by a **licensed health care professional (LHCP)** is recordable even if it results in no days away, no restriction, and no medical treatment beyond first aid. Examples: cancer, chronic irreversible disease, fractured or cracked bone, punctured eardrum.

**Implementation:** `packages/regulatory-logic/src/recordability.ts`, wizard step `SIGNIFICANT_INJURY`

---

### Step 10 — Loss of Consciousness (`LOSS_OF_CONSCIOUSNESS`)
**CFR:** 29 CFR 1904.7(a)(5)

If the injury or illness results in **loss of consciousness**, it is recordable as outcome J, regardless of how brief the episode was.

**Implementation:** `packages/regulatory-logic/src/recordability.ts`, wizard step `LOSS_OF_CONSCIOUSNESS`

---

### Step 11 — Hearing Loss Threshold (`HEARING_LOSS_THRESHOLD`)
**CFR:** 29 CFR 1904.10

Record a hearing loss case when:
1. An audiogram reveals a **Standard Threshold Shift (STS)** of **10 dB or more** averaged at 2000, 3000, and 4000 Hz, **AND**
2. The employee's total hearing level is **25 dB or more above audiometric zero** in the same ear(s)

When recorded, the case type is **M5 — Hearing Loss**.

**Implementation:** `packages/regulatory-logic/src/recordability.ts`, wizard step `HEARING_LOSS_THRESHOLD`

---

### Step 12 — Privacy Case Check (`FINAL_DECISION`)
**CFR:** 29 CFR 1904.29(b)(7)–(9)

After determining the case is recordable, determine if it is a **privacy concern case**. If any of the six privacy reasons apply, do NOT enter the employee's name on the 300 Log — enter "privacy case" instead.

| Reason | CFR |
|--------|-----|
| Intimate body part or reproductive system injury/illness | 1904.29(b)(7)(i) |
| Sexual assault | 1904.29(b)(7)(ii) |
| Mental illness | 1904.29(b)(7)(iii) |
| HIV infection, hepatitis, tuberculosis | 1904.29(b)(7)(iv) |
| Needlestick or sharps injury with blood or OPIM | 1904.29(b)(7)(v) |
| Employee voluntarily requests privacy protection | 1904.29(b)(7)(vi) |

Per 1904.29(b)(6): Maintain a **separate, confidential list** of case numbers and employee names for privacy cases, available to government representatives on request.

Per 1904.29(b)(9): The description in the "Describe injury" column may be made generic if a specific description would identify the employee.

**Implementation:** `packages/regulatory-logic/src/privacy.ts` → `evaluatePrivacyCase()`, `getAllPrivacyReasons()`, `sanitizePrivacyCaseDescription()`

---

## Classification Exclusivity Rules

After the wizard completes, two additional rules apply:

### Most-Serious-Outcome Rule (Columns G–J)
**CFR:** 29 CFR 1904.7(a) (implied by single-check design of the 300 Log)

Only **one** of columns G, H, I, J may be checked. If multiple outcomes apply, check the most serious:
`G (Death) > H (Days Away) > I (Restricted) > J (Other Recordable)`

**Implementation:** `packages/regulatory-logic/src/classification.ts` → `classifyOutcome()`

### Injury vs. Illness Exclusivity (Columns M1–M6)
**CFR:** 29 CFR 1904.29(b)(2)

An injury is a **single instantaneous event**. An illness is a **condition caused by repeated exposure** over time. They are mutually exclusive — a case is either an injury (M1) or one of the five illness types (M2–M6), never both.

**Implementation:** `packages/regulatory-logic/src/classification.ts` → `validateCaseTypeExclusivity()`
