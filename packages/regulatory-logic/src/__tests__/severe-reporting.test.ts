import { describe, it, expect } from "vitest";
import { checkSevereReporting, computeReportingDeadline } from "../severe-reporting.js";
import { SeverityLevel } from "../types.js";

function hoursAfter(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 3600 * 1000);
}

function daysAfter(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 3600 * 1000);
}

const INCIDENT = new Date("2024-03-10T08:00:00Z");

describe("checkSevereReporting — 29 CFR 1904.39", () => {
  describe("1904.39(a)(1) — fatality (8-hour report)", () => {
    it("requires report when fatality occurs within 30 days of incident", () => {
      const result = checkSevereReporting({
        severityLevel: SeverityLevel.FATALITY,
        incidentDateTime: INCIDENT,
        outcomeDateTime: daysAfter(INCIDENT, 5),
        isPublicHighwayMVA: false,
        isCommercialTransportation: false,
      });
      expect(result.mustReport).toBe(true);
      expect(result.reportingDeadlineFromDiscovery.hours).toBe(8);
      expect(result.cfr).toContain("1904.39(a)(1)");
    });

    it("requires report when fatality occurs exactly on day 30", () => {
      const result = checkSevereReporting({
        severityLevel: SeverityLevel.FATALITY,
        incidentDateTime: INCIDENT,
        outcomeDateTime: daysAfter(INCIDENT, 30),
        isPublicHighwayMVA: false,
        isCommercialTransportation: false,
      });
      expect(result.mustReport).toBe(true);
    });

    it("does NOT require report when fatality occurs after 30 days", () => {
      const result = checkSevereReporting({
        severityLevel: SeverityLevel.FATALITY,
        incidentDateTime: INCIDENT,
        outcomeDateTime: daysAfter(INCIDENT, 31),
        isPublicHighwayMVA: false,
        isCommercialTransportation: false,
      });
      expect(result.mustReport).toBe(false);
      expect(result.cfr).toContain("1904.39(b)(4)");
    });
  });

  describe("1904.39(a)(2) — hospitalization/amputation/eye loss (24-hour report)", () => {
    it.each([
      SeverityLevel.HOSPITALIZATION,
      SeverityLevel.AMPUTATION,
      SeverityLevel.EYE_LOSS,
    ])("requires report for %s occurring within 24 hours of incident", (level) => {
      const result = checkSevereReporting({
        severityLevel: level,
        incidentDateTime: INCIDENT,
        outcomeDateTime: hoursAfter(INCIDENT, 12),
        isPublicHighwayMVA: false,
        isCommercialTransportation: false,
      });
      expect(result.mustReport).toBe(true);
      expect(result.reportingDeadlineFromDiscovery.hours).toBe(24);
      expect(result.cfr).toContain("1904.39(a)(2)");
    });

    it("requires report when outcome occurs exactly at 24-hour mark", () => {
      const result = checkSevereReporting({
        severityLevel: SeverityLevel.HOSPITALIZATION,
        incidentDateTime: INCIDENT,
        outcomeDateTime: hoursAfter(INCIDENT, 24),
        isPublicHighwayMVA: false,
        isCommercialTransportation: false,
      });
      expect(result.mustReport).toBe(true);
    });

    it("does NOT require report when hospitalization occurs after 24 hours", () => {
      const result = checkSevereReporting({
        severityLevel: SeverityLevel.HOSPITALIZATION,
        incidentDateTime: INCIDENT,
        outcomeDateTime: hoursAfter(INCIDENT, 25),
        isPublicHighwayMVA: false,
        isCommercialTransportation: false,
      });
      expect(result.mustReport).toBe(false);
    });
  });

  describe("1904.39(b)(3) — exceptions", () => {
    it("does NOT require report for public highway MVA", () => {
      const result = checkSevereReporting({
        severityLevel: SeverityLevel.FATALITY,
        incidentDateTime: INCIDENT,
        outcomeDateTime: hoursAfter(INCIDENT, 2),
        isPublicHighwayMVA: true,
        isCommercialTransportation: false,
      });
      expect(result.mustReport).toBe(false);
      expect(result.cfr).toContain("1904.39(b)(3)");
    });

    it("does NOT require report for commercial transportation accident", () => {
      const result = checkSevereReporting({
        severityLevel: SeverityLevel.FATALITY,
        incidentDateTime: INCIDENT,
        outcomeDateTime: hoursAfter(INCIDENT, 2),
        isPublicHighwayMVA: false,
        isCommercialTransportation: true,
      });
      expect(result.mustReport).toBe(false);
    });
  });

  describe("computeReportingDeadline helper", () => {
    it("adds 8 hours to discovery time for fatalities", () => {
      const discovery = new Date("2024-03-10T10:00:00Z");
      const deadline = computeReportingDeadline(discovery, 8);
      expect(deadline.toISOString()).toBe("2024-03-10T18:00:00.000Z");
    });

    it("adds 24 hours to discovery time for other severe events", () => {
      const discovery = new Date("2024-03-10T10:00:00Z");
      const deadline = computeReportingDeadline(discovery, 24);
      expect(deadline.toISOString()).toBe("2024-03-11T10:00:00.000Z");
    });
  });
});
