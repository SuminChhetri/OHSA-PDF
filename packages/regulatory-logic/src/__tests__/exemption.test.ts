import { describe, it, expect } from "vitest";
import { checkExemption } from "../exemption.js";

describe("checkExemption — 29 CFR 1904.1, 1904.2", () => {
  describe("1904.1 — small employer exemption (≤10 employees)", () => {
    it("is exempt when peak employee count is 1", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 1, naicsCode: "2361" });
      expect(result.isExempt).toBe(true);
      expect(result.reason).toBe("SMALL_EMPLOYER");
      expect(result.cfr).toContain("1904.1");
    });

    it("is exempt when peak employee count is exactly 10", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 10, naicsCode: "2361" });
      expect(result.isExempt).toBe(true);
      expect(result.reason).toBe("SMALL_EMPLOYER");
    });

    it("is NOT exempt when peak employee count is 11", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 11, naicsCode: "2361" });
      expect(result.isExempt).toBe(false);
    });

    it("exempt employers still must report severe injuries", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 5, naicsCode: "2361" });
      expect(result.mustStillReportSevereInjuries).toBe(true);
    });
  });

  describe("1904.2 — low-hazard industry exemption (Appendix A to Subpart B)", () => {
    it("is exempt for NAICS 5411 (Legal Services)", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 50, naicsCode: "5411" });
      expect(result.isExempt).toBe(true);
      expect(result.reason).toBe("LOW_HAZARD_INDUSTRY");
      expect(result.cfr).toContain("1904.2");
    });

    it("is exempt for NAICS 6211 (Offices of Physicians)", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 100, naicsCode: "6211" });
      expect(result.isExempt).toBe(true);
      expect(result.reason).toBe("LOW_HAZARD_INDUSTRY");
    });

    it("is exempt for NAICS 8131 (Religious Organizations)", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 25, naicsCode: "8131" });
      expect(result.isExempt).toBe(true);
    });

    it("is NOT exempt for construction (NAICS 2361)", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 25, naicsCode: "2361" });
      expect(result.isExempt).toBe(false);
    });

    it("is NOT exempt for manufacturing (NAICS 3116)", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 50, naicsCode: "3116" });
      expect(result.isExempt).toBe(false);
    });

    it("exempt employers still must report severe injuries", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 50, naicsCode: "5411" });
      expect(result.mustStillReportSevereInjuries).toBe(true);
    });

    it("small employer takes precedence over industry check", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 8, naicsCode: "2361" });
      expect(result.reason).toBe("SMALL_EMPLOYER");
    });
  });

  describe("non-exempt establishments", () => {
    it("must maintain records for hazardous industry with 11+ employees", () => {
      const result = checkExemption({ peakEmployeeCountPriorYear: 25, naicsCode: "3116" });
      expect(result.isExempt).toBe(false);
      expect(result.notes).toContain("Must maintain");
    });
  });
});
