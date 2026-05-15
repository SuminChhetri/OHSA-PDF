/**
 * Severe injury and fatality reporting per 29 CFR 1904.39.
 *
 * 1904.39(a)(1): Within 8 hours after the death of any employee as a result of a
 *   work-related incident, you must report the fatality to OSHA.
 *   Applies if the fatality occurs within 30 days of the work-related incident.
 *
 * 1904.39(a)(2): Within 24 hours after:
 *   (i)  The in-patient hospitalization of one or more employees, OR
 *   (ii) An employee's amputation, OR
 *   (iii) An employee's loss of an eye
 *   as a result of a work-related incident.
 *   Applies if the hospitalization/amputation/eye loss occurs within 24 hours of the incident.
 *
 * 1904.39(b)(3): You do not have to report an event if it results from a motor
 *   vehicle accident on a public street or highway, or from a commercial airplane,
 *   train, subway, or bus accident.
 *
 * 1904.39(b)(4): You do not have to report the work-related fatality if it occurred
 *   more than 30 days after the work-related incident.
 *
 * Reporting methods:
 *   - Nearest OSHA Area Office during business hours
 *   - OSHA 24-hour hotline: 1-800-321-OSHA (6742)
 *   - Online at www.osha.gov
 */

import { SevereReportingInput, SevereReportingResult, SeverityLevel } from "./types.js";

/** Time window (in hours) after the work-related incident within which the outcome
 *  must have occurred for reporting to be required. 1904.39(a)(2). */
const HOSPITALIZATION_WINDOW_HOURS = 24;
const FATALITY_WINDOW_DAYS = 30;

/**
 * Determines whether a severe injury, illness, or fatality must be reported to OSHA
 * and computes the reporting deadline.
 */
export function checkSevereReporting(
  input: SevereReportingInput
): SevereReportingResult {
  // Exceptions: public highway MVA or commercial transportation. 1904.39(b)(3).
  if (input.isPublicHighwayMVA || input.isCommercialTransportation) {
    return {
      mustReport: false,
      reportingDeadlineFromDiscovery: { hours: 8, description: "N/A — exception applies" },
      cfr: "29 CFR 1904.39(b)(3)",
      notes:
        "Event resulted from a motor vehicle accident on a public street or highway, " +
        "or from a commercial transportation accident. Reporting not required. 1904.39(b)(3).",
      withinTriggerWindow: false,
    };
  }

  const incidentMs = input.incidentDateTime.getTime();
  const outcomeMs = input.outcomeDateTime.getTime();
  const elapsedMs = outcomeMs - incidentMs;

  if (input.severityLevel === SeverityLevel.FATALITY) {
    // Fatality must have occurred within 30 days of the incident. 1904.39(b)(4).
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const withinWindow = elapsedDays <= FATALITY_WINDOW_DAYS;

    if (!withinWindow) {
      return {
        mustReport: false,
        reportingDeadlineFromDiscovery: { hours: 8, description: "N/A — outside 30-day window" },
        cfr: "29 CFR 1904.39(b)(4)",
        notes:
          `Fatality occurred ${elapsedDays.toFixed(1)} days after the work-related incident, ` +
          `which is outside the ${FATALITY_WINDOW_DAYS}-day window. Reporting not required. 1904.39(b)(4).`,
        withinTriggerWindow: false,
      };
    }

    return {
      mustReport: true,
      reportingDeadlineFromDiscovery: {
        hours: 8,
        description: "Report within 8 hours of learning of the fatality.",
      },
      cfr: "29 CFR 1904.39(a)(1)",
      notes:
        `Work-related fatality. Must report to OSHA within 8 hours of learning of the death. ` +
        "Call 1-800-321-OSHA (6742), visit the nearest OSHA Area Office, or report online at osha.gov.",
      withinTriggerWindow: true,
    };
  }

  // For hospitalization, amputation, and eye loss — outcome must occur within 24 hours
  // of the incident. 1904.39(a)(2).
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const withinWindow = elapsedHours <= HOSPITALIZATION_WINDOW_HOURS;

  if (!withinWindow) {
    return {
      mustReport: false,
      reportingDeadlineFromDiscovery: { hours: 24, description: "N/A — outside 24-hour window" },
      cfr: "29 CFR 1904.39(a)(2)",
      notes:
        `The ${describeOutcome(input.severityLevel)} occurred ${elapsedHours.toFixed(1)} hours ` +
        `after the work-related incident, which is outside the ${HOSPITALIZATION_WINDOW_HOURS}-hour window. ` +
        "Reporting not required. 1904.39(a)(2).",
      withinTriggerWindow: false,
    };
  }

  const outcomeDescription = describeOutcome(input.severityLevel);
  return {
    mustReport: true,
    reportingDeadlineFromDiscovery: {
      hours: 24,
      description: `Report within 24 hours of learning of the ${outcomeDescription}.`,
    },
    cfr: "29 CFR 1904.39(a)(2)",
    notes:
      `Work-related ${outcomeDescription}. Must report to OSHA within 24 hours of learning of the event. ` +
      "Call 1-800-321-OSHA (6742), visit the nearest OSHA Area Office, or report online at osha.gov.",
    withinTriggerWindow: true,
  };
}

/**
 * Computes the absolute reporting deadline given when the employer learned of the event.
 */
export function computeReportingDeadline(
  discoveryDateTime: Date,
  hoursToReport: 8 | 24
): Date {
  return new Date(discoveryDateTime.getTime() + hoursToReport * 60 * 60 * 1000);
}

function describeOutcome(level: SeverityLevel): string {
  switch (level) {
    case SeverityLevel.FATALITY:
      return "fatality";
    case SeverityLevel.HOSPITALIZATION:
      return "in-patient hospitalization";
    case SeverityLevel.AMPUTATION:
      return "amputation";
    case SeverityLevel.EYE_LOSS:
      return "loss of an eye";
  }
}
