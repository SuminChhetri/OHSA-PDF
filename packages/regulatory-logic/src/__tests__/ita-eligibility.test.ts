import { describe, it, expect } from "vitest";
import { checkITAEligibility, computeITADeadline, EXCLUDED_FIELDS_300, EXCLUDED_FIELDS_301 } from "../ita-eligibility.js";

describe("checkITAEligibility — 29 CFR 1904.41", () => {
  describe("1904.41(a) — submission tiers", () => {
    it("tier 1: 250+ employees in any industry must submit 300A", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 250,
        naicsCode: "5411", // Legal services — normally exempt from recordkeeping but not ITA
        reportingYear: 2024,
      });
      expect(result.mustSubmit300A).toBe(true);
      expect(result.mustSubmit300And301).toBe(false);
      expect(result.tier).toBe("300A_ONLY");
      expect(result.cfr).toContain("1904.41");
    });

    it("tier 1: 500 employees in low-hazard industry still must submit 300A", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 500,
        naicsCode: "5415", // Computer systems design — Appendix A exempt
        reportingYear: 2024,
      });
      expect(result.mustSubmit300A).toBe(true);
      expect(result.tier).toBe("300A_ONLY");
    });

    it("tier 3: 100+ employees in Appendix B industry must submit 300A + 300 + 301", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 150,
        naicsCode: "3116", // Animal slaughtering — Appendix B
        reportingYear: 2024,
      });
      expect(result.mustSubmit300A).toBe(true);
      expect(result.mustSubmit300And301).toBe(true);
      expect(result.tier).toBe("ALL_FORMS");
      expect(result.cfr).toContain("1904.41(a)(2)");
    });

    it("tier 3: exactly 100 employees in Appendix B industry triggers ALL_FORMS", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 100,
        naicsCode: "6221", // General hospitals — Appendix B
        reportingYear: 2024,
      });
      expect(result.tier).toBe("ALL_FORMS");
    });

    it("99 employees in Appendix B industry does NOT trigger tier 3", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 99,
        naicsCode: "6221",
        reportingYear: 2024,
      });
      expect(result.tier).not.toBe("ALL_FORMS");
    });

    it("tier 2: 20–249 employees flags potential 300A requirement", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 100,
        naicsCode: "2361", // Construction — not Appendix B
        reportingYear: 2024,
      });
      // Should at minimum flag 300A as potentially required
      expect(result.mustSubmit300A).toBe(true);
      expect(result.cfr).toContain("1904.41");
    });

    it("under 20 employees — no ITA submission required", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 19,
        naicsCode: "3116",
        reportingYear: 2024,
      });
      expect(result.tier).toBe("NONE");
      expect(result.mustSubmit300A).toBe(false);
      expect(result.mustSubmit300And301).toBe(false);
    });

    it("1 employee — no ITA submission required", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 1,
        naicsCode: "3116",
        reportingYear: 2024,
      });
      expect(result.tier).toBe("NONE");
    });
  });

  describe("1904.41(a)(2) — March 2 submission deadline", () => {
    it("deadline is March 2 of the following year", () => {
      const deadline = computeITADeadline(2024);
      expect(deadline.getUTCFullYear()).toBe(2025);
      expect(deadline.getUTCMonth()).toBe(2); // 0-indexed: 2 = March
      expect(deadline.getUTCDate()).toBe(2);
    });

    it("deadline in result matches computeITADeadline", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 300,
        naicsCode: "2361",
        reportingYear: 2024,
      });
      const expected = computeITADeadline(2024);
      expect(result.submissionDeadline.getTime()).toBe(expected.getTime());
    });
  });

  describe("1904.41(c) — excluded fields", () => {
    it("300 excluded fields contain employee name", () => {
      expect(EXCLUDED_FIELDS_300.some((f) => f.toLowerCase().includes("employee name"))).toBe(true);
    });

    it("301 excluded fields contain employee name and home address", () => {
      expect(EXCLUDED_FIELDS_301.some((f) => f.toLowerCase().includes("employee name"))).toBe(true);
      expect(EXCLUDED_FIELDS_301.some((f) => f.toLowerCase().includes("address"))).toBe(true);
    });

    it("ALL_FORMS result includes excluded fields", () => {
      const result = checkITAEligibility({
        totalEmployeesInYear: 200,
        naicsCode: "3116",
        reportingYear: 2024,
      });
      expect(result.excludedFields).toBeDefined();
      expect((result.excludedFields ?? []).length).toBeGreaterThan(0);
    });
  });
});
