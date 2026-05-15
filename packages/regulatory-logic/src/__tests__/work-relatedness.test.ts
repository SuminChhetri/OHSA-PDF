import { describe, it, expect } from "vitest";
import { determineWorkRelatedness } from "../work-relatedness.js";
import { WorkRelatednessException } from "../types.js";

describe("determineWorkRelatedness — 29 CFR 1904.5", () => {
  describe("1904.5(a) — work environment presumption", () => {
    it("is work-related when in work environment with no exceptions", () => {
      const result = determineWorkRelatedness({
        occurredInWorkEnvironment: true,
        applicableExceptions: [],
      });
      expect(result.isWorkRelated).toBe(true);
      expect(result.cfr).toContain("1904.5(a)");
    });

    it("is NOT work-related when event occurred outside work environment", () => {
      const result = determineWorkRelatedness({
        occurredInWorkEnvironment: false,
        applicableExceptions: [],
      });
      expect(result.isWorkRelated).toBe(false);
      expect(result.cfr).toContain("1904.5(a)");
    });
  });

  describe("1904.5(b)(2) — exceptions to work-relatedness", () => {
    it.each([
      [WorkRelatednessException.GENERAL_PUBLIC, "1904.5(b)(2)(i)"],
      [WorkRelatednessException.NON_WORK_EVENT, "1904.5(b)(2)(ii)"],
      [WorkRelatednessException.VOLUNTARY_WELLNESS, "1904.5(b)(2)(iii)"],
      [WorkRelatednessException.EATING_DRINKING, "1904.5(b)(2)(iv)"],
      [WorkRelatednessException.PERSONAL_TASK, "1904.5(b)(2)(v)"],
      [WorkRelatednessException.PERSONAL_GROOMING, "1904.5(b)(2)(vi)"],
      [WorkRelatednessException.COMMUTE_PARKING, "1904.5(b)(2)(vii)"],
      [WorkRelatednessException.COMMON_COLD_FLU, "1904.5(b)(2)(viii)"],
      [WorkRelatednessException.MENTAL_ILLNESS_UNCONFIRMED, "1904.5(b)(2)(ix)"],
    ])("exception %s makes case NOT work-related", (exception) => {
      const result = determineWorkRelatedness({
        occurredInWorkEnvironment: true,
        applicableExceptions: [exception],
      });
      expect(result.isWorkRelated).toBe(false);
      expect(result.cfr).toContain("1904.5(b)(2)");
      expect(result.appliedExceptions).toContain(exception);
    });

    it("multiple exceptions are all reported", () => {
      const result = determineWorkRelatedness({
        occurredInWorkEnvironment: true,
        applicableExceptions: [
          WorkRelatednessException.COMMON_COLD_FLU,
          WorkRelatednessException.EATING_DRINKING,
        ],
      });
      expect(result.isWorkRelated).toBe(false);
      expect(result.appliedExceptions).toHaveLength(2);
    });

    it("empty exceptions array does not block work-relatedness", () => {
      const result = determineWorkRelatedness({
        occurredInWorkEnvironment: true,
        applicableExceptions: [],
      });
      expect(result.isWorkRelated).toBe(true);
    });
  });
});
