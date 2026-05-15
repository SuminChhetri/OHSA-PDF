/**
 * React-PDF document for OSHA Form 301 — Injury and Illness Incident Report
 * Letter portrait (8.5in × 11in) per OSHA Form 301 (Rev. 01/2004)
 * 29 CFR 1904.29(b)
 */

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const OUTCOME_LABELS: Record<string, string> = {
  DEATH: "G — Death",
  DAYS_AWAY: "H — Days Away From Work",
  RESTRICTED_TRANSFER: "I — Restricted Work or Job Transfer",
  OTHER_RECORDABLE: "J — Other Recordable Case",
};

const CASE_TYPE_LABELS: Record<string, string> = {
  INJURY: "M1 — Injury",
  SKIN_DISORDER: "M2 — Skin Disorder",
  RESPIRATORY: "M3 — Respiratory Condition",
  POISONING: "M4 — Poisoning",
  HEARING_LOSS: "M5 — Hearing Loss",
  ALL_OTHER_ILLNESS: "M6 — All Other Illnesses",
};

const PRIVACY_LABELS: Record<string, string> = {
  INTIMATE_BODY_PART: "Intimate body part — 1904.29(b)(7)(i)",
  SEXUAL_ASSAULT: "Sexual assault — 1904.29(b)(7)(ii)",
  MENTAL_ILLNESS: "Mental illness — 1904.29(b)(7)(iii)",
  HIV_HEPATITIS_TB: "HIV/Hepatitis/TB — 1904.29(b)(7)(iv)",
  NEEDLESTICK: "Needlestick/sharps — 1904.29(b)(7)(v)",
  EMPLOYEE_REQUEST: "Employee request — 1904.29(b)(7)(vi)",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: "0.5in",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  formTitle: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  formSubtitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 2 },
  cfr: { fontSize: 8, color: "#444", marginTop: 2 },
  caseNum: { fontSize: 9 },
  privacyBanner: {
    padding: "5 8",
    borderWidth: 2,
    borderColor: "#b45309",
    backgroundColor: "#fef3c7",
    marginBottom: 10,
  },
  privacyText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#92400e" },
  severeBanner: {
    padding: "5 8",
    borderWidth: 2,
    borderColor: "#dc2626",
    backgroundColor: "#fee2e2",
    marginBottom: 10,
  },
  severeText: { fontSize: 9, color: "#7f1d1d" },
  section: { marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 2,
    marginBottom: 7,
  },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  sectionCfr: { fontSize: 7, color: "#666" },
  grid2: { flexDirection: "row", gap: 14 },
  grid3: { flexDirection: "row", gap: 14 },
  grid4: { flexDirection: "row", gap: 10 },
  field: { flex: 1, marginBottom: 6 },
  fieldLabel: { fontSize: 7, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  fieldValue: {
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    minHeight: 15,
    paddingBottom: 2,
    fontSize: 9,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#999",
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: "#555" },
});

export type Form301CaseData = {
  caseNumber: string;
  employeeName: string;
  employeeJobTitle: string;
  employeeDOB?: Date | string | null;
  employeeHireDate?: Date | string | null;
  employeeStreet?: string | null;
  employeeCity?: string | null;
  employeeState?: string | null;
  employeeZip?: string | null;
  dateOfInjury: Date | string;
  timeOfInjury?: string | null;
  whereEventOccurred: string;
  whatEmployeeWasDoing: string;
  whatHappened: string;
  bodyPartAffected: string;
  objectOrSubstance: string;
  treatedInEmergencyRoom: boolean;
  hospitalizedOvernight: boolean;
  physicianName?: string | null;
  facilityName?: string | null;
  facilityStreet?: string | null;
  facilityCity?: string | null;
  facilityState?: string | null;
  facilityZip?: string | null;
  outcome: string;
  daysAway: number;
  daysRestricted: number;
  caseType: string;
  isPrivacyCase: boolean;
  privacyReason?: string | null;
  severityLevel?: string | null;
};

function Field({ label, value }: { label: string; value?: string | null | boolean }) {
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : (value ?? "");
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValue}>
        <Text>{display}</Text>
      </View>
    </View>
  );
}

function Section({ title, cfr, children }: { title: string; cfr?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {cfr && <Text style={styles.sectionCfr}>{cfr}</Text>}
      </View>
      {children}
    </View>
  );
}

function fmtDate(d?: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US");
}

function fmtAddress(street?: string | null, city?: string | null, state?: string | null, zip?: string | null): string {
  return [street, city, state, zip].filter(Boolean).join(", ");
}

export function Form301Pdf({ caseData }: { caseData: Form301CaseData }) {
  return (
    <Document
      title={`OSHA Form 301 — Case ${caseData.caseNumber}`}
      author="OSHA Recordkeeping System"
      subject="Injury and Illness Incident Report"
    >
      {/* 8.5in × 11in portrait = 612pt × 792pt */}
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.formTitle}>OSHA&apos;s Form 301 (Rev. 01/2004)</Text>
            <Text style={styles.formSubtitle}>Injury and Illness Incident Report</Text>
            <Text style={styles.cfr}>29 CFR 1904.29(b)</Text>
          </View>
          <View>
            <Text style={styles.caseNum}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Case #: </Text>
              {caseData.caseNumber}
            </Text>
          </View>
        </View>

        {/* Privacy banner */}
        {caseData.isPrivacyCase && (
          <View style={styles.privacyBanner}>
            <Text style={styles.privacyText}>
              PRIVACY CONCERN CASE — 29 CFR 1904.29(b)(6)
              {caseData.privacyReason ? ` — ${PRIVACY_LABELS[caseData.privacyReason] ?? caseData.privacyReason}` : ""}
            </Text>
          </View>
        )}

        {/* Section 1 — Employee */}
        <Section title="Section 1 — Employee Information" cfr="29 CFR 1904.29(b)(1)–(4)">
          <View style={styles.grid2}>
            <Field label="Full Name" value={caseData.employeeName} />
            <Field label="Job Title" value={caseData.employeeJobTitle} />
          </View>
          <View style={styles.grid2}>
            <Field label="Date of Birth" value={fmtDate(caseData.employeeDOB)} />
            <Field label="Date Hired" value={fmtDate(caseData.employeeHireDate)} />
          </View>
          <Field
            label="Home Address"
            value={fmtAddress(caseData.employeeStreet, caseData.employeeCity, caseData.employeeState, caseData.employeeZip)}
          />
        </Section>

        {/* Section 2 — LHCP */}
        <Section title="Section 2 — Physician or Other Health Care Professional" cfr="29 CFR 1904.29(b)(1)">
          <View style={styles.grid2}>
            <Field label="Physician / LHCP Name" value={caseData.physicianName} />
            <Field label="Facility Name" value={caseData.facilityName} />
          </View>
          <View style={styles.grid2}>
            <Field label="Treated in Emergency Room?" value={caseData.treatedInEmergencyRoom} />
            <Field label="Hospitalized Overnight?" value={caseData.hospitalizedOvernight} />
          </View>
          <Field
            label="Facility Address"
            value={fmtAddress(caseData.facilityStreet, caseData.facilityCity, caseData.facilityState, caseData.facilityZip)}
          />
        </Section>

        {/* Section 3 — Case info */}
        <Section title="Section 3 — Information About the Case" cfr="29 CFR 1904.7(b)">
          <View style={styles.grid2}>
            <Field label="Date of Injury / Illness" value={fmtDate(caseData.dateOfInjury)} />
            <Field label="Time of Event" value={caseData.timeOfInjury} />
          </View>
          <Field label="Where did the event occur?" value={caseData.whereEventOccurred} />
          <Field
            label="What was the employee doing just before the incident occurred?"
            value={caseData.whatEmployeeWasDoing}
          />
          <Field
            label="What happened? Describe the injury or illness, parts of body affected, and object/equipment involved."
            value={caseData.whatHappened}
          />
          <View style={styles.grid2}>
            <Field label="Body Part Affected" value={caseData.bodyPartAffected} />
            <Field label="Object or Substance That Directly Harmed Employee" value={caseData.objectOrSubstance} />
          </View>
        </Section>

        {/* Section 4 — Classification */}
        <Section title="Section 4 — Case Classification (300 Log)" cfr="29 CFR 1904.7(a)">
          <View style={styles.grid4}>
            <Field label="Outcome (G/H/I/J)" value={OUTCOME_LABELS[caseData.outcome] ?? caseData.outcome} />
            <Field label="Days Away from Work (K)" value={String(caseData.daysAway)} />
            <Field label="Days Restricted/Transfer (L)" value={String(caseData.daysRestricted)} />
            <Field label="Case Type (M1–M6)" value={CASE_TYPE_LABELS[caseData.caseType] ?? caseData.caseType} />
          </View>
        </Section>

        {/* Severe injury banner */}
        {caseData.severityLevel && (
          <View style={styles.severeBanner}>
            <Text style={styles.severeText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Severe Injury — 29 CFR 1904.39: </Text>
              {caseData.severityLevel}. Mandatory OSHA reporting required within 8 or 24 hours of incident.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This form contains personally identifiable information and must be handled per 29 CFR 1904.29(b)(6).
            Form 301 is the employer&apos;s confidential incident report. Keep for 5 years per 29 CFR 1904.33.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
