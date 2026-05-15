type CaseRow = {
  id: string;
  caseNumber: string;
  employeeName: string;
  employeeJobTitle: string;
  dateOfInjury: Date | string;
  whereEventOccurred: string;
  whatHappened: string;
  isPrivacyCase: boolean;
  outcome: string;
  daysAway: number;
  daysRestricted: number;
  caseType: string;
};

type Establishment = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  naicsCode: string;
  sicCode?: string | null;
};

interface Form300PrintViewProps {
  cases: CaseRow[];
  establishment: Establishment;
  year: number;
}

function PrintCheckBox({ checked }: { checked: boolean }) {
  return (
    <td
      style={{
        border: "1px solid #000",
        textAlign: "center",
        width: "24px",
        fontSize: "10px",
        fontWeight: "bold",
      }}
    >
      {checked ? "✓" : ""}
    </td>
  );
}

export function Form300PrintView({ cases, establishment, year }: Form300PrintViewProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        color: "#000",
        padding: "0.5in",
        background: "#fff",
      }}
    >
      <style>{`
        @media print {
          @page {
            size: 14in 8.5in landscape;
            margin: 0.5in;
          }
          body { margin: 0; }
        }
      `}</style>

      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "bold" }}>
              Log of Work-Related Injuries and Illnesses
            </div>
            <div style={{ fontSize: "9px", marginTop: "2px" }}>
              OSHA&apos;s Form 300 (Rev. 01/2004) · 29 CFR 1904.7 · Year {year}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "9px" }}>
            <div><strong>Establishment:</strong> {establishment.name}</div>
            <div>{establishment.street}, {establishment.city}, {establishment.state} {establishment.zip}</div>
            <div><strong>NAICS:</strong> {establishment.naicsCode}{establishment.sicCode ? ` / SIC: ${establishment.sicCode}` : ""}</div>
          </div>
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "9px",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: "50px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "60px" }} />
          <col style={{ width: "90px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "30px" }} />
          <col style={{ width: "30px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "22px" }} />
          <col style={{ width: "22px" }} />
        </colgroup>
        <thead>
          <tr style={{ background: "#ddd", border: "1px solid #000" }}>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "left" }}>
              (A) Case #
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "left" }}>
              (B) Employee Name
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "left" }}>
              (C) Job Title
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "left" }}>
              (D) Date
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "left" }}>
              (E) Location
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "left" }}>
              (F) Describe Illness/Injury
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              G
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              H
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              I
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              J
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              (K) Days Away
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              (L) Restr.
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              M1
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              M2
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              M3
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              M4
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              M5
            </th>
            <th style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              M6
            </th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr
              key={c.id}
              style={{
                background:
                  c.outcome === "DEATH"
                    ? "#fee2e2"
                    : c.isPrivacyCase
                    ? "#fef9c3"
                    : "transparent",
              }}
            >
              <td style={{ border: "1px solid #000", padding: "2px 3px", fontFamily: "monospace" }}>
                {c.caseNumber}
              </td>
              <td style={{ border: "1px solid #000", padding: "2px 3px", fontStyle: c.isPrivacyCase ? "italic" : "normal" }}>
                {c.employeeName}
                {c.isPrivacyCase ? " 🔒" : ""}
              </td>
              <td style={{ border: "1px solid #000", padding: "2px 3px" }}>{c.employeeJobTitle}</td>
              <td style={{ border: "1px solid #000", padding: "2px 3px", whiteSpace: "nowrap" }}>
                {new Date(c.dateOfInjury).toLocaleDateString("en-US")}
              </td>
              <td style={{ border: "1px solid #000", padding: "2px 3px" }}>{c.whereEventOccurred}</td>
              <td style={{ border: "1px solid #000", padding: "2px 3px" }}>{c.whatHappened}</td>
              <PrintCheckBox checked={c.outcome === "DEATH"} />
              <PrintCheckBox checked={c.outcome === "DAYS_AWAY"} />
              <PrintCheckBox checked={c.outcome === "RESTRICTED_TRANSFER"} />
              <PrintCheckBox checked={c.outcome === "OTHER_RECORDABLE"} />
              <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
                {c.daysAway > 0 ? c.daysAway : ""}
              </td>
              <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
                {c.daysRestricted > 0 ? c.daysRestricted : ""}
              </td>
              <PrintCheckBox checked={c.caseType === "INJURY"} />
              <PrintCheckBox checked={c.caseType === "SKIN_DISORDER"} />
              <PrintCheckBox checked={c.caseType === "RESPIRATORY"} />
              <PrintCheckBox checked={c.caseType === "POISONING"} />
              <PrintCheckBox checked={c.caseType === "HEARING_LOSS"} />
              <PrintCheckBox checked={c.caseType === "ALL_OTHER_ILLNESS"} />
            </tr>
          ))}
          {cases.length === 0 && (
            <tr>
              <td
                colSpan={18}
                style={{ border: "1px solid #000", padding: "6px", textAlign: "center", color: "#666" }}
              >
                No recordable cases for this period
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
            <td colSpan={6} style={{ border: "1px solid #000", padding: "2px 3px" }}>Totals</td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.outcome === "DEATH").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.outcome === "DAYS_AWAY").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.outcome === "RESTRICTED_TRANSFER").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.outcome === "OTHER_RECORDABLE").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.reduce((s, c) => s + c.daysAway, 0) || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.reduce((s, c) => s + c.daysRestricted, 0) || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.caseType === "INJURY").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.caseType === "SKIN_DISORDER").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.caseType === "RESPIRATORY").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.caseType === "POISONING").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.caseType === "HEARING_LOSS").length || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "2px 3px", textAlign: "center" }}>
              {cases.filter((c) => c.caseType === "ALL_OTHER_ILLNESS").length || ""}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: "6px", fontSize: "8px", color: "#444" }}>
        G=Death · H=Days Away From Work · I=Restricted/Transfer · J=Other Recordable ·
        K=Days Away Count · L=Days Restricted Count · M1=Injury · M2=Skin Disorder ·
        M3=Respiratory · M4=Poisoning · M5=Hearing Loss · M6=Other Illness
      </div>
    </div>
  );
}
