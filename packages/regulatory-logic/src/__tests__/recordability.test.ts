import { describe, it, expect } from "vitest";
import { evaluateRecordability } from "../recordability.js";
import {
  RecordabilityInput,
  WorkRelatednessException,
  BeyondFirstAidTreatment,
} from "../types.js";

// Minimal base input — not work-related, just a template
const BASE_NOT_RECORDABLE: RecordabilityInput = {
  inWorkEnvironment: true,
  workRelatednessExceptions: [],
  isNewCase: true,
  resultedInDeath: false,
  daysAwayFromWork: 0,
  daysOfRestrictedWork: 0,
  daysOfJobTransfer: 0,
  receivedMedicalTreatment: false,
  firstAidTreatmentsOnly: [],
  beyondFirstAidTreatments: [],
  resultedInLossOfConsciousness: false,
  diagnosedSignificantInjury: false,
  isNeedlestickWithBloodOrOPIM: false,
  isAudiogramConfirmedSTS: false,
  isWorkRelatedTBDiagnosis: false,
};

describe("evaluateRecordability — 29 CFR 1904", () => {
  // ── Not recordable scenarios ────────────────────────────────────────────────

  describe("Step 1 — 1904.5 work-relatedness", () => {
    it("is NOT recordable when injury occurred outside work environment", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        inWorkEnvironment: false,
      });
      expect(result.isRecordable).toBe(false);
      expect(result.cfr).toContain("1904.5");
    });

    it("is NOT recordable when a 1904.5(b)(2) exception applies", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        workRelatednessExceptions: [WorkRelatednessException.COMMON_COLD_FLU],
      });
      expect(result.isRecordable).toBe(false);
      expect(result.decisionPath[0]?.determination).toBe("NOT_RECORDABLE");
    });
  });

  describe("Step 2 — 1904.6 new case", () => {
    it("is NOT recordable when it is not a new case", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        isNewCase: false,
      });
      expect(result.isRecordable).toBe(false);
      expect(result.cfr).toContain("1904.6");
    });
  });

  describe("General criteria not met", () => {
    it("is NOT recordable when no criterion is met", () => {
      const result = evaluateRecordability(BASE_NOT_RECORDABLE);
      expect(result.isRecordable).toBe(false);
      expect(result.cfr).toContain("1904.7");
    });
  });

  // ── Recordable scenarios — 1904.7(a)(1)–(6) ─────────────────────────────────

  describe("1904.7(a)(1) — Death", () => {
    it("is recordable when employee died", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        resultedInDeath: true,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.7(a)(1)");
    });

    it("death takes precedence in the decision path", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        resultedInDeath: true,
        daysAwayFromWork: 5,
      });
      expect(result.isRecordable).toBe(true);
      const deathStep = result.decisionPath.find((s) => s.step === "DEATH");
      expect(deathStep?.determination).toBe("RECORDABLE");
    });
  });

  describe("1904.7(a)(2) — Days away from work", () => {
    it("is recordable when employee had 1 day away", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        daysAwayFromWork: 1,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.7(a)(2)");
    });

    it("is recordable when employee had many days away", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        daysAwayFromWork: 180,
      });
      expect(result.isRecordable).toBe(true);
    });

    it("is NOT recordable for 0 days away alone", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        daysAwayFromWork: 0,
      });
      expect(result.isRecordable).toBe(false);
    });
  });

  describe("1904.7(a)(3) — Restricted work or job transfer", () => {
    it("is recordable with restricted work days", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        daysOfRestrictedWork: 3,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.7(a)(3)");
    });

    it("is recordable with job transfer days", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        daysOfJobTransfer: 2,
      });
      expect(result.isRecordable).toBe(true);
    });
  });

  describe("1904.7(a)(4) — Medical treatment beyond first aid", () => {
    it("is recordable when receivedMedicalTreatment is true", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        receivedMedicalTreatment: true,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.7(a)(4)");
    });

    it("is recordable when beyond-first-aid treatments list is populated", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        beyondFirstAidTreatments: [BeyondFirstAidTreatment.SUTURES],
      });
      expect(result.isRecordable).toBe(true);
    });

    it("is recordable with prescription medications", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        beyondFirstAidTreatments: [BeyondFirstAidTreatment.PRESCRIPTION_MED],
      });
      expect(result.isRecordable).toBe(true);
    });

    it("is NOT recordable for first-aid-only treatment", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        receivedMedicalTreatment: false,
        beyondFirstAidTreatments: [],
      });
      expect(result.isRecordable).toBe(false);
    });
  });

  describe("1904.7(a)(5) — Loss of consciousness", () => {
    it("is recordable when employee lost consciousness", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        resultedInLossOfConsciousness: true,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.7(a)(5)");
    });
  });

  describe("1904.7(a)(6) — Significant injury or illness diagnosed by LHCP", () => {
    it("is recordable when LHCP diagnosed significant injury", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        diagnosedSignificantInjury: true,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.7(a)(6)");
    });
  });

  // ── Special cases ──────────────────────────────────────────────────────────

  describe("1904.8 — Needlestick/sharps", () => {
    it("is recordable for needlestick contaminated with blood or OPIM", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        isNeedlestickWithBloodOrOPIM: true,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.8");
    });

    it("needlestick is recordable even with no other criteria", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        isNeedlestickWithBloodOrOPIM: true,
        receivedMedicalTreatment: false,
        daysAwayFromWork: 0,
      });
      expect(result.isRecordable).toBe(true);
    });
  });

  describe("1904.10 — Hearing loss (STS)", () => {
    it("is recordable for audiogram-confirmed STS", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        isAudiogramConfirmedSTS: true,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.10");
    });
  });

  describe("1904.11 — Tuberculosis", () => {
    it("is recordable for work-related TB diagnosis", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        isWorkRelatedTBDiagnosis: true,
      });
      expect(result.isRecordable).toBe(true);
      expect(result.cfr).toContain("1904.11");
    });
  });

  // ── Decision path integrity ─────────────────────────────────────────────────

  describe("decision path", () => {
    it("populates a full decision path for all steps evaluated", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        daysAwayFromWork: 2,
      });
      expect(result.decisionPath.length).toBeGreaterThan(0);
      expect(result.decisionPath.every((s) => s.cfr)).toBe(true);
    });

    it("short-circuits after death — does not evaluate remaining criteria", () => {
      const result = evaluateRecordability({
        ...BASE_NOT_RECORDABLE,
        resultedInDeath: true,
        daysAwayFromWork: 5,
      });
      const steps = result.decisionPath.map((s) => s.step);
      expect(steps).toContain("DEATH");
      expect(steps).not.toContain("DAYS_AWAY");
    });
  });
});
