type CaseData = {
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

interface Form301PrintViewProps {
  caseData: CaseData;
}

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

function LabeledField({ label, value }: { label: string; value?: string | null | boolean }) {
  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{ fontSize: "8px", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ borderBottom: "1px solid #999", minHeight: "16px", paddingBottom: "2px", fontSize: "10px" }}>
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? ""}
      </div>
    </div>
  );
}

function SectionHeader({ title, cfr }: { title: string; cfr?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        borderBottom: "2px solid #000",
        marginBottom: "8px",
        paddingBottom: "2px",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: "bold" }}>{title}</div>
      {cfr && <div style={{ fontSize: "8px", color: "#666" }}>{cfr}</div>}
    </div>
  );
}

export function Form301PrintView({ caseData }: Form301PrintViewProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        color: "#000",
        padding: "0.5in",
        background: "#fff",
        maxWidth: "8.5in",
      }}
    >
      <style>{`
        @media print {
          @page {
            size: 8.5in 11in portrait;
            margin: 0.5in;
          }
          body { margin: 0; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>OSHA&apos;s Form 301 (Rev. 01/2004)</div>
          <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "2px" }}>
            Injury and Illness Incident Report
          </div>
          <div style={{ fontSize: "9px", marginTop: "2px", color: "#444" }}>29 CFR 1904.29(b)</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px" }}><strong>Case #:</strong> {caseData.caseNumber}</div>
        </div>
      </div>

      {caseData.isPrivacyCase && (
        <div
          style={{
            padding: "6px 10px",
            border: "2px solid #b45309",
            background: "#fef3c7",
            marginBottom: "12px",
            fontSize: "10px",
            fontWeight: "bold",
            color: "#92400e",
          }}
        >
          PRIVACY CONCERN CASE — 29 CFR 1904.29(b)(6){caseData.privacyReason ? ` — ${PRIVACY_LABELS[caseData.privacyReason] ?? caseData.privacyReason}` : ""}
        </div>
      )}

      <div style={{ marginBottom: "14px" }}>
        <SectionHeader title="Section 1 — Employee Information" cfr="29 CFR 1904.29(b)(1)–(4)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <LabeledField label="Full Name" value={caseData.employeeName} />
          <LabeledField label="Job Title" value={caseData.employeeJobTitle} />
          <LabeledField
            label="Date of Birth"
            value={caseData.employeeDOB ? new Date(caseData.employeeDOB).toLocaleDateString("en-US") : null}
          />
          <LabeledField
            label="Date Hired"
            value={caseData.employeeHireDate ? new Date(caseData.employeeHireDate).toLocaleDateString("en-US") : null}
          />
        </div>
        <LabeledField
          label="Home Address"
          value={[caseData.employeeStreet, caseData.employeeCity, caseData.employeeState, caseData.employeeZip].filter(Boolean).join(", ") || null}
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <SectionHeader title="Section 2 — Physician or Other Health Care Professional" cfr="29 CFR 1904.29(b)(1)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <LabeledField label="Physician / LHCP Name" value={caseData.physicianName} />
          <LabeledField label="Facility Name" value={caseData.facilityName} />
          <LabeledField label="Treated in Emergency Room?" value={caseData.treatedInEmergencyRoom} />
          <LabeledField label="Hospitalized Overnight?" value={caseData.hospitalizedOvernight} />
        </div>
        <LabeledField
          label="Facility Address"
          value={[caseData.facilityStreet, caseData.facilityCity, caseData.facilityState, caseData.facilityZip].filter(Boolean).join(", ") || null}
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <SectionHeader title="Section 3 — Information About the Case" cfr="29 CFR 1904.7(b)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <LabeledField
            label="Date of Injury / Illness"
            value={new Date(caseData.dateOfInjury).toLocaleDateString("en-US")}
          />
          <LabeledField label="Time of Event" value={caseData.timeOfInjury} />
          <LabeledField label="Where did the event occur?" value={caseData.whereEventOccurred} />
        </div>
        <LabeledField label="What was the employee doing just before the incident occurred?" value={caseData.whatEmployeeWasDoing} />
        <LabeledField label="What happened? Describe the injury or illness, parts of body affected, and object/equipment involved." value={caseData.whatHappened} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <LabeledField label="Body Part Affected" value={caseData.bodyPartAffected} />
          <LabeledField label="Object or Substance That Directly Harmed Employee" value={caseData.objectOrSubstance} />
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <SectionHeader title="Section 4 — Case Classification (300 Log)" cfr="29 CFR 1904.7(a)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 16px" }}>
          <LabeledField label="Outcome" value={OUTCOME_LABELS[caseData.outcome] ?? caseData.outcome} />
          <LabeledField label="Days Away from Work (K)" value={caseData.daysAway > 0 ? String(caseData.daysAway) : "0"} />
          <LabeledField label="Days Restricted/Transfer (L)" value={caseData.daysRestricted > 0 ? String(caseData.daysRestricted) : "0"} />
          <LabeledField label="Case Type" value={CASE_TYPE_LABELS[caseData.caseType] ?? caseData.caseType} />
        </div>
      </div>

      {caseData.severityLevel && (
        <div
          style={{
            padding: "6px 10px",
            border: "2px solid #dc2626",
            background: "#fee2e2",
            marginBottom: "12px",
            fontSize: "10px",
            color: "#7f1d1d",
          }}
        >
          <strong>Severe Injury — 29 CFR 1904.39:</strong> {caseData.severityLevel}. Mandatory OSHA reporting required.
        </div>
      )}

      <div style={{ marginTop: "20px", borderTop: "1px solid #999", paddingTop: "8px", fontSize: "8px", color: "#555" }}>
        This form contains personally identifiable information and must be handled per 29 CFR 1904.29(b)(6).
        Form 301 is the employer&apos;s confidential incident report. Keep for 5 years per 29 CFR 1904.33.
      </div>
    </div>
  );
}
