/**
 * Redaction layer — produces a version of a Case with all sensitive PII
 * and medical fields replaced with "[REDACTED]" strings.
 *
 * Used by:
 *   - PDF routes when ?redacted=1 is set
 *   - Any query path where the user role is REVIEWER or DOWNLOAD_REVIEWER
 *
 * Roles that CAN view unredacted data:
 *   OWNER, ADMIN, EDITOR, RECORDKEEPER, SENSITIVE_REVIEWER, EXECUTIVE
 *
 * Roles that MUST receive redacted data:
 *   REVIEWER, DOWNLOAD_REVIEWER (when downloading, limited to redacted PDF)
 */

/** Returns true if the given role may view unredacted / sensitive case data. */
export function canViewSensitiveData(role: string | null | undefined): boolean {
  return ["OWNER", "ADMIN", "EDITOR", "RECORDKEEPER", "SENSITIVE_REVIEWER", "EXECUTIVE"].includes(
    role ?? ""
  );
}

/** Returns true if the given role may download the unredacted PDF. */
export function canDownloadUnredacted(role: string | null | undefined): boolean {
  return ["OWNER", "ADMIN", "EDITOR", "RECORDKEEPER", "SENSITIVE_REVIEWER", "EXECUTIVE"].includes(
    role ?? ""
  );
}

const R = "[REDACTED]";

type AnyCase = Record<string, unknown>;

/**
 * Returns a copy of the case with all sensitive fields replaced by "[REDACTED]".
 * Non-sensitive fields (case number, date, outcome, caseType, etc.) are preserved
 * because they are needed for the 300 Log and metrics calculations.
 */
export function redactCase<T extends AnyCase>(c: T): T {
  return {
    ...c,
    // Employee PII
    employeeName: c.isPrivacyCase ? "privacy case" : R,
    employeeDOB: null,
    employeeHireDate: null,
    employeeStreet: R,
    employeeCity: R,
    employeeState: R,
    employeeZip: R,
    // Incident narrative
    whatHappened: R,
    whatEmployeeWasDoing: R,
    bodyPartAffected: R,
    objectOrSubstance: R,
    timeOfInjury: null,
    // Medical / LHCP
    physicianName: R,
    facilityName: R,
    facilityStreet: R,
    facilityCity: R,
    facilityState: R,
    facilityZip: R,
  };
}
