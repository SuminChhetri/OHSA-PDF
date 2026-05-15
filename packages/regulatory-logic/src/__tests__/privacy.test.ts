import { describe, it, expect } from "vitest";
import {
  evaluatePrivacyCase,
  getAllPrivacyReasons,
  sanitizePrivacyCaseDescription,
} from "../privacy.js";
import { PrivacyReason } from "../types.js";

describe("evaluatePrivacyCase — 29 CFR 1904.29(b)(7)–(9)", () => {
  describe("1904.29(b)(7) — privacy concern cases", () => {
    it.each([
      PrivacyReason.INTIMATE_BODY_PART,
      PrivacyReason.SEXUAL_ASSAULT,
      PrivacyReason.MENTAL_ILLNESS,
      PrivacyReason.HIV_HEPATITIS_TB,
      PrivacyReason.NEEDLESTICK,
    ])("is a privacy case when reason is %s", (reason) => {
      const result = evaluatePrivacyCase({
        privacyReason: reason,
        employeeRequestedPrivacy: false,
      });
      expect(result.isPrivacyCase).toBe(true);
      expect(result.reason).toBe(reason);
      expect(result.logDisplayName).toBe("privacy case");
      expect(result.cfr).toContain("1904.29(b)(7)");
    });

    it("is a privacy case when employee voluntarily requests privacy (1904.29(b)(7)(vi))", () => {
      const result = evaluatePrivacyCase({
        privacyReason: undefined,
        employeeRequestedPrivacy: true,
      });
      expect(result.isPrivacyCase).toBe(true);
      expect(result.reason).toBe(PrivacyReason.EMPLOYEE_REQUEST);
      expect(result.cfr).toContain("1904.29(b)(7)(vi)");
    });

    it("is NOT a privacy case when no reason and no employee request", () => {
      const result = evaluatePrivacyCase({
        privacyReason: undefined,
        employeeRequestedPrivacy: false,
      });
      expect(result.isPrivacyCase).toBe(false);
      expect(result.reason).toBeUndefined();
    });
  });

  describe("1904.29(b)(8) — exhaustive list", () => {
    it("getAllPrivacyReasons returns exactly 6 reasons (the complete list)", () => {
      const reasons = getAllPrivacyReasons();
      expect(reasons).toHaveLength(6);
    });

    it("all 6 categories are present", () => {
      const reasons = getAllPrivacyReasons().map((r) => r.reason);
      expect(reasons).toContain(PrivacyReason.INTIMATE_BODY_PART);
      expect(reasons).toContain(PrivacyReason.SEXUAL_ASSAULT);
      expect(reasons).toContain(PrivacyReason.MENTAL_ILLNESS);
      expect(reasons).toContain(PrivacyReason.HIV_HEPATITIS_TB);
      expect(reasons).toContain(PrivacyReason.NEEDLESTICK);
      expect(reasons).toContain(PrivacyReason.EMPLOYEE_REQUEST);
    });
  });

  describe("1904.29(b)(9) — description sanitization", () => {
    it("replaces identifying description for SEXUAL_ASSAULT cases", () => {
      const sanitized = sanitizePrivacyCaseDescription(
        "Employee was sexually assaulted by supervisor",
        PrivacyReason.SEXUAL_ASSAULT
      );
      expect(sanitized).not.toContain("sexually assaulted");
      expect(sanitized).toContain("withheld");
    });

    it("replaces identifying description for MENTAL_ILLNESS cases", () => {
      const sanitized = sanitizePrivacyCaseDescription(
        "Employee suffered a panic attack and was diagnosed with PTSD",
        PrivacyReason.MENTAL_ILLNESS
      );
      expect(sanitized).toContain("withheld");
    });

    it("preserves description for NEEDLESTICK cases (not identifying)", () => {
      const original = "Needlestick injury while handling sharps container";
      const sanitized = sanitizePrivacyCaseDescription(
        original,
        PrivacyReason.NEEDLESTICK
      );
      expect(sanitized).toBe(original);
    });

    it("preserves description for EMPLOYEE_REQUEST cases (only name hidden)", () => {
      const original = "Sprained ankle while walking on wet floor in break room";
      const sanitized = sanitizePrivacyCaseDescription(
        original,
        PrivacyReason.EMPLOYEE_REQUEST
      );
      expect(sanitized).toBe(original);
    });
  });
});
