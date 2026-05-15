import { describe, it, expect } from "vitest";
import {
  classifyOutcome,
  validateCaseTypeExclusivity,
} from "../classification.js";
import { CaseOutcome, CaseType } from "../types.js";

describe("classifyOutcome — 29 CFR 1904.7(a) columns G–J", () => {
  describe("most-serious-outcome rule", () => {
    it("classifies as DEATH (col G) when employee died", () => {
      const result = classifyOutcome({
        resultedInDeath: true,
        daysAwayFromWork: 5,
        daysOfRestrictedOrTransfer: 10,
        hasOtherRecordableCriteria: true,
      });
      expect(result.outcome).toBe(CaseOutcome.DEATH);
      expect(result.cfr).toContain("1904.7(a)(1)");
    });

    it("classifies as DAYS_AWAY (col H) when no death but has days away", () => {
      const result = classifyOutcome({
        resultedInDeath: false,
        daysAwayFromWork: 3,
        daysOfRestrictedOrTransfer: 5,
        hasOtherRecordableCriteria: true,
      });
      expect(result.outcome).toBe(CaseOutcome.DAYS_AWAY);
      expect(result.cfr).toContain("1904.7(a)(2)");
    });

    it("classifies as RESTRICTED_TRANSFER (col I) when no death/days away but has restriction", () => {
      const result = classifyOutcome({
        resultedInDeath: false,
        daysAwayFromWork: 0,
        daysOfRestrictedOrTransfer: 7,
        hasOtherRecordableCriteria: true,
      });
      expect(result.outcome).toBe(CaseOutcome.RESTRICTED_TRANSFER);
      expect(result.cfr).toContain("1904.7(a)(3)");
    });

    it("classifies as OTHER_RECORDABLE (col J) when no death/days away/restriction", () => {
      const result = classifyOutcome({
        resultedInDeath: false,
        daysAwayFromWork: 0,
        daysOfRestrictedOrTransfer: 0,
        hasOtherRecordableCriteria: true,
      });
      expect(result.outcome).toBe(CaseOutcome.OTHER_RECORDABLE);
      expect(result.cfr).toContain("1904.7(a)(4)");
    });

    it("death takes precedence over all other outcomes", () => {
      const result = classifyOutcome({
        resultedInDeath: true,
        daysAwayFromWork: 180,
        daysOfRestrictedOrTransfer: 180,
        hasOtherRecordableCriteria: true,
      });
      expect(result.outcome).toBe(CaseOutcome.DEATH);
    });

    it("days away takes precedence over restriction/transfer", () => {
      const result = classifyOutcome({
        resultedInDeath: false,
        daysAwayFromWork: 1,
        daysOfRestrictedOrTransfer: 100,
        hasOtherRecordableCriteria: false,
      });
      expect(result.outcome).toBe(CaseOutcome.DAYS_AWAY);
    });

    it("throws when no recordable criterion is met (should never be reached)", () => {
      expect(() =>
        classifyOutcome({
          resultedInDeath: false,
          daysAwayFromWork: 0,
          daysOfRestrictedOrTransfer: 0,
          hasOtherRecordableCriteria: false,
        })
      ).toThrow();
    });
  });
});

describe("validateCaseTypeExclusivity — 300 Log columns M1–M6", () => {
  it("INJURY type is valid when case is an injury", () => {
    const result = validateCaseTypeExclusivity(CaseType.INJURY, true);
    expect(result.valid).toBe(true);
  });

  it("INJURY type is INVALID when case is an illness", () => {
    const result = validateCaseTypeExclusivity(CaseType.INJURY, false);
    expect(result.valid).toBe(false);
  });

  it("SKIN_DISORDER is valid when case is an illness", () => {
    const result = validateCaseTypeExclusivity(CaseType.SKIN_DISORDER, false);
    expect(result.valid).toBe(true);
  });

  it("SKIN_DISORDER is INVALID when case is an injury", () => {
    const result = validateCaseTypeExclusivity(CaseType.SKIN_DISORDER, true);
    expect(result.valid).toBe(false);
  });

  it.each([
    CaseType.RESPIRATORY,
    CaseType.POISONING,
    CaseType.HEARING_LOSS,
    CaseType.ALL_OTHER_ILLNESS,
  ])("illness type %s is valid for illness case", (caseType) => {
    const result = validateCaseTypeExclusivity(caseType, false);
    expect(result.valid).toBe(true);
  });

  it.each([
    CaseType.RESPIRATORY,
    CaseType.POISONING,
    CaseType.HEARING_LOSS,
    CaseType.ALL_OTHER_ILLNESS,
  ])("illness type %s is INVALID for injury case", (caseType) => {
    const result = validateCaseTypeExclusivity(caseType, true);
    expect(result.valid).toBe(false);
  });
});
