import { describe, it, expect } from "vitest";
import {
  createWizard,
  advanceWizard,
  getWizardStep,
  WIZARD_STEPS,
} from "../wizard.js";

describe("Recordability Wizard — 29 CFR 1904.4–1904.11", () => {
  describe("initialization", () => {
    it("starts at WORK_ENVIRONMENT step", () => {
      const state = createWizard();
      expect(state.currentStep).toBe("WORK_ENVIRONMENT");
      expect(state.isComplete).toBe(false);
      expect(state.result).toBeUndefined();
    });

    it("starts with empty answers", () => {
      const state = createWizard();
      expect(Object.keys(state.answers)).toHaveLength(0);
    });
  });

  describe("step definitions", () => {
    it("all steps have a question and CFR citation", () => {
      for (const step of WIZARD_STEPS) {
        expect(step.question.length).toBeGreaterThan(0);
        expect(step.cfr).toContain("1904");
      }
    });

    it("getWizardStep returns correct step by ID", () => {
      const step = getWizardStep("WORK_ENVIRONMENT");
      expect(step?.id).toBe("WORK_ENVIRONMENT");
    });
  });

  describe("short-circuit: not in work environment → not recordable", () => {
    it("terminates immediately with NOT recordable", () => {
      const state1 = createWizard();
      const state2 = advanceWizard(state1, false); // not in work environment
      expect(state2.isComplete).toBe(true);
      expect(state2.result?.isRecordable).toBe(false);
    });
  });

  describe("short-circuit: work-relatedness exception → not recordable", () => {
    it("terminates after exception step", () => {
      let state = createWizard();
      state = advanceWizard(state, true);  // in work environment
      state = advanceWizard(state, true);  // exception applies
      expect(state.isComplete).toBe(true);
      expect(state.result?.isRecordable).toBe(false);
    });
  });

  describe("short-circuit: not a new case → not recordable", () => {
    it("terminates after new case step", () => {
      let state = createWizard();
      state = advanceWizard(state, true);  // in work environment
      state = advanceWizard(state, false); // no exception
      state = advanceWizard(state, false); // not a new case
      expect(state.isComplete).toBe(true);
      expect(state.result?.isRecordable).toBe(false);
    });
  });

  describe("short-circuit: death → recordable", () => {
    it("terminates immediately after death step with recordable", () => {
      let state = createWizard();
      state = advanceWizard(state, true);  // in work environment
      state = advanceWizard(state, false); // no exception
      state = advanceWizard(state, true);  // new case
      state = advanceWizard(state, true);  // resulted in death
      expect(state.isComplete).toBe(true);
      expect(state.result?.isRecordable).toBe(true);
      expect(state.result?.cfr).toContain("1904.7(a)(1)");
    });
  });

  describe("short-circuit: days away → recordable", () => {
    it("terminates after days-away step when days > 0", () => {
      let state = createWizard();
      state = advanceWizard(state, true);  // in work environment
      state = advanceWizard(state, false); // no exception
      state = advanceWizard(state, true);  // new case
      state = advanceWizard(state, false); // no death
      state = advanceWizard(state, 5);     // 5 days away
      expect(state.isComplete).toBe(true);
      expect(state.result?.isRecordable).toBe(true);
      expect(state.result?.cfr).toContain("1904.7(a)(2)");
    });
  });

  describe("short-circuit: restricted work → recordable", () => {
    it("terminates after restricted work step", () => {
      let state = createWizard();
      state = advanceWizard(state, true);  // in work environment
      state = advanceWizard(state, false); // no exception
      state = advanceWizard(state, true);  // new case
      state = advanceWizard(state, false); // no death
      state = advanceWizard(state, 0);     // 0 days away
      state = advanceWizard(state, true);  // restricted work
      expect(state.isComplete).toBe(true);
      expect(state.result?.isRecordable).toBe(true);
      expect(state.result?.cfr).toContain("1904.7(a)(3)");
    });
  });

  describe("short-circuit: medical treatment beyond first aid → recordable", () => {
    it("terminates after medical treatment step", () => {
      let state = createWizard();
      state = advanceWizard(state, true);  // in work environment
      state = advanceWizard(state, false); // no exception
      state = advanceWizard(state, true);  // new case
      state = advanceWizard(state, false); // no death
      state = advanceWizard(state, 0);     // 0 days away
      state = advanceWizard(state, false); // no restriction
      state = advanceWizard(state, true);  // medical treatment beyond first aid
      expect(state.isComplete).toBe(true);
      expect(state.result?.isRecordable).toBe(true);
      expect(state.result?.cfr).toContain("1904.7(a)(4)");
    });
  });

  describe("full path — not recordable (first-aid only, no other criteria)", () => {
    it("returns NOT recordable after traversing all criteria", () => {
      let state = createWizard();
      state = advanceWizard(state, true);  // in work environment
      state = advanceWizard(state, false); // no exception
      state = advanceWizard(state, true);  // new case
      state = advanceWizard(state, false); // no death
      state = advanceWizard(state, 0);     // 0 days away
      state = advanceWizard(state, false); // no restriction
      state = advanceWizard(state, false); // no medical treatment beyond first aid
      state = advanceWizard(state, false); // no loss of consciousness
      state = advanceWizard(state, false); // no significant injury diagnosis
      state = advanceWizard(state, false); // no special cases
      expect(state.isComplete).toBe(true);
      expect(state.result?.isRecordable).toBe(false);
    });
  });

  describe("completed steps tracking", () => {
    it("records each completed step", () => {
      let state = createWizard();
      state = advanceWizard(state, true);  // WORK_ENVIRONMENT
      expect(state.completedSteps).toContain("WORK_ENVIRONMENT");
      state = advanceWizard(state, false); // WORK_RELATEDNESS_EXCEPTIONS
      expect(state.completedSteps).toContain("WORK_RELATEDNESS_EXCEPTIONS");
    });
  });

  describe("state immutability", () => {
    it("does not mutate the original state", () => {
      const original = createWizard();
      const originalCopy = JSON.stringify(original);
      advanceWizard(original, true);
      expect(JSON.stringify(original)).toBe(originalCopy);
    });
  });
});
