type Establishment = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  naicsCode: string;
  sicCode?: string | null;
};

type Totals = {
  totalDeaths: number;
  totalDaysAwayFromWork: number;
  totalJobTransferOrRestriction: number;
  totalOtherRecordable: number;
  totalDaysAway: number;
  totalDaysRestricted: number;
  totalInjuries: number;
  totalSkinDisorders: number;
  totalRespiratoryConditions: number;
  totalPoisonings: number;
  totalHearingLoss: number;
  totalAllOtherIllnesses: number;
};

type Certification = {
  signerName: string;
  signerTitle: string;
  certifiedAt: Date | string;
} | null;

interface Form300APrintViewProps {
  establishment: Establishment;
  year: number;
  avgEmployees: number | null | undefined;
  totalHoursWorked: number | null | undefined;
  totals: Totals;
  certification: Certification;
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <td
        style={{
          border: "1px solid #000",
          padding: "3px 6px",
          fontSize: "10px",
        }}
      >
        {label}
      </td>
      <td
        style={{
          border: "1px solid #000",
          padding: "3px 6px",
          textAlign: "right",
          fontWeight: "bold",
          width: "60px",
          fontSize: "11px",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export function Form300APrintView({
  establishment,
  year,
  avgEmployees,
  totalHoursWorked,
  totals,
  certification,
}: Form300APrintViewProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        color: "#000",
        padding: "0.5in",
        background: "#fff",
        maxWidth: "11in",
      }}
    >
      <style>{`
        @media print {
          @page {
            size: 11in 8.5in landscape;
            margin: 0.5in;
          }
          body { margin: 0; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            OSHA&apos;s Form 300A (Rev. 01/2004)
          </div>
          <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "2px" }}>
            Summary of Work-Related Injuries and Illnesses
          </div>
          <div style={{ fontSize: "9px", marginTop: "4px", color: "#444" }}>
            29 CFR 1904.32 · Year {year}
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: "9px" }}>
          <div style={{ fontWeight: "bold", fontSize: "11px" }}>{establishment.name}</div>
          <div>{establishment.street}</div>
          <div>{establishment.city}, {establishment.state} {establishment.zip}</div>
          <div>NAICS: {establishment.naicsCode}{establishment.sicCode ? ` / SIC: ${establishment.sicCode}` : ""}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "6px", borderBottom: "2px solid #000", paddingBottom: "2px" }}>
            Number of Cases
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <SummaryRow label="(G) Total number of deaths" value={totals.totalDeaths} />
              <SummaryRow label="(H) Total cases with days away from work" value={totals.totalDaysAwayFromWork} />
              <SummaryRow label="(I) Total cases with job transfer or restriction" value={totals.totalJobTransferOrRestriction} />
              <SummaryRow label="(J) Total other recordable cases" value={totals.totalOtherRecordable} />
            </tbody>
          </table>

          <div style={{ fontSize: "11px", fontWeight: "bold", marginTop: "10px", marginBottom: "6px", borderBottom: "2px solid #000", paddingBottom: "2px" }}>
            Number of Days
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <SummaryRow label="(K) Total number of days away from work" value={totals.totalDaysAway} />
              <SummaryRow label="(L) Total number of days of job transfer or restriction" value={totals.totalDaysRestricted} />
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "6px", borderBottom: "2px solid #000", paddingBottom: "2px" }}>
            Injury and Illness Types
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <SummaryRow label="(M1) Injuries" value={totals.totalInjuries} />
              <SummaryRow label="(M2) Skin disorders" value={totals.totalSkinDisorders} />
              <SummaryRow label="(M3) Respiratory conditions" value={totals.totalRespiratoryConditions} />
              <SummaryRow label="(M4) Poisonings" value={totals.totalPoisonings} />
              <SummaryRow label="(M5) Hearing loss" value={totals.totalHearingLoss} />
              <SummaryRow label="(M6) All other illnesses" value={totals.totalAllOtherIllnesses} />
            </tbody>
          </table>

          <div style={{ fontSize: "11px", fontWeight: "bold", marginTop: "10px", marginBottom: "6px", borderBottom: "2px solid #000", paddingBottom: "2px" }}>
            Employment Information
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "10px" }}>
                  Annual average number of employees
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "right", fontWeight: "bold", width: "80px" }}>
                  {avgEmployees?.toLocaleString() ?? "—"}
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "10px" }}>
                  Total hours worked by all employees last year
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "right", fontWeight: "bold", width: "80px" }}>
                  {totalHoursWorked?.toLocaleString() ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "16px", borderTop: "2px solid #000", paddingTop: "10px" }}>
        <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>
          Certification — 29 CFR 1904.32(b)(3)
        </div>
        <p style={{ fontSize: "9px", color: "#444", marginBottom: "8px" }}>
          I certify that I have examined this document and that to the best of my knowledge the entries are true, accurate, and complete.
        </p>
        {certification ? (
          <div>
            <div style={{ display: "flex", gap: "40px" }}>
              <div>
                <div style={{ fontSize: "9px", color: "#666" }}>Signature</div>
                <div style={{ borderBottom: "1px solid #000", minWidth: "200px", paddingBottom: "2px", marginTop: "12px" }}>
                  {certification.signerName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "#666" }}>Title</div>
                <div style={{ borderBottom: "1px solid #000", minWidth: "150px", paddingBottom: "2px", marginTop: "12px" }}>
                  {certification.signerTitle}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "#666" }}>Date</div>
                <div style={{ borderBottom: "1px solid #000", minWidth: "100px", paddingBottom: "2px", marginTop: "12px" }}>
                  {new Date(certification.certifiedAt).toLocaleDateString("en-US")}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "40px" }}>
            <div>
              <div style={{ fontSize: "9px", color: "#666" }}>Signature</div>
              <div style={{ borderBottom: "1px solid #000", minWidth: "200px", height: "20px", marginTop: "4px" }} />
            </div>
            <div>
              <div style={{ fontSize: "9px", color: "#666" }}>Title</div>
              <div style={{ borderBottom: "1px solid #000", minWidth: "150px", height: "20px", marginTop: "4px" }} />
            </div>
            <div>
              <div style={{ fontSize: "9px", color: "#666" }}>Date</div>
              <div style={{ borderBottom: "1px solid #000", minWidth: "100px", height: "20px", marginTop: "4px" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "12px", padding: "6px 8px", border: "1px solid #999", background: "#f9f9f9", fontSize: "9px" }}>
        <strong>Posting Requirement — 29 CFR 1904.32(b)(6):</strong> This Summary page (Form 300A) MUST be posted in your establishment
        in a conspicuous place or places where notices to employees are customarily posted from February 1 through April 30 ({year + 1}).
        Failure to post this document may result in citation and penalty.
      </div>
    </div>
  );
}
