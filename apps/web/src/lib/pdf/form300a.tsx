/**
 * React-PDF document for OSHA Form 300A — Summary of Work-Related Injuries and Illnesses
 * Letter landscape (11in × 8.5in) per OSHA Form 300A (Rev. 01/2004)
 * 29 CFR 1904.32
 */

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    padding: "0.5in",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 2 },
  cfr: { fontSize: 8, color: "#444", marginTop: 3 },
  headerRight: { textAlign: "right", fontSize: 8 },
  bodyRow: { flexDirection: "row", gap: 20 },
  section: { flex: 1, marginBottom: 12 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 2,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    borderTopWidth: 0,
    minHeight: 18,
  },
  tableRowFirst: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    minHeight: 18,
  },
  tdLabel: {
    flex: 1,
    padding: "3 6",
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
    justifyContent: "center",
  },
  tdValue: {
    width: 60,
    padding: "3 6",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    justifyContent: "center",
  },
  divider: { height: 10 },
  certBox: {
    marginTop: 14,
    borderTopWidth: 2,
    borderTopColor: "#000",
    paddingTop: 10,
  },
  certTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  certNote: { fontSize: 7, color: "#444", marginBottom: 8 },
  certFields: { flexDirection: "row", gap: 30 },
  certField: { flex: 1 },
  certFieldLabel: { fontSize: 7, color: "#666", marginBottom: 3 },
  certFieldValue: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
    minHeight: 20,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  postingBox: {
    marginTop: 10,
    padding: "6 8",
    borderWidth: 1,
    borderColor: "#999",
    backgroundColor: "#f9f9f9",
  },
  postingText: { fontSize: 7, color: "#333" },
});

export type Form300AData = {
  establishment: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    naicsCode: string;
    sicCode?: string | null;
  };
  year: number;
  avgEmployees?: number | null;
  totalHoursWorked?: number | null;
  totals: {
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
  certification?: {
    signerName: string;
    signerTitle: string;
    certifiedAt: Date | string;
  } | null;
};

function TableEntry({
  label,
  value,
  first,
}: {
  label: string;
  value: number;
  first?: boolean;
}) {
  return (
    <View style={first ? styles.tableRowFirst : styles.tableRow}>
      <View style={styles.tdLabel}>
        <Text>{label}</Text>
      </View>
      <View style={styles.tdValue}>
        <Text>{value}</Text>
      </View>
    </View>
  );
}

export function Form300APdf({
  establishment,
  year,
  avgEmployees,
  totalHoursWorked,
  totals,
  certification,
}: Form300AData) {
  return (
    <Document
      title={`OSHA Form 300A — ${establishment.name} — ${year}`}
      author="OSHA Recordkeeping System"
      subject="Summary of Work-Related Injuries and Illnesses"
    >
      {/* 11in × 8.5in landscape = 792pt × 612pt */}
      <Page size={[792, 612]} orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>OSHA&apos;s Form 300A (Rev. 01/2004)</Text>
            <Text style={styles.subtitle}>Summary of Work-Related Injuries and Illnesses</Text>
            <Text style={styles.cfr}>29 CFR 1904.32 · Year {year}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>{establishment.name}</Text>
            <Text>{establishment.street}</Text>
            <Text>
              {establishment.city}, {establishment.state} {establishment.zip}
            </Text>
            <Text>
              NAICS: {establishment.naicsCode}
              {establishment.sicCode ? ` / SIC: ${establishment.sicCode}` : ""}
            </Text>
          </View>
        </View>

        {/* Body — two columns */}
        <View style={styles.bodyRow}>
          {/* Left column: case counts + day counts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Cases</Text>
            <TableEntry label="(G) Total number of deaths" value={totals.totalDeaths} first />
            <TableEntry label="(H) Total cases with days away from work" value={totals.totalDaysAwayFromWork} />
            <TableEntry label="(I) Total cases with job transfer or restriction" value={totals.totalJobTransferOrRestriction} />
            <TableEntry label="(J) Total other recordable cases" value={totals.totalOtherRecordable} />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Number of Days</Text>
            <TableEntry label="(K) Total number of days away from work" value={totals.totalDaysAway} first />
            <TableEntry label="(L) Total number of days of job transfer or restriction" value={totals.totalDaysRestricted} />
          </View>

          {/* Right column: illness types + employment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Injury and Illness Types</Text>
            <TableEntry label="(M1) Injuries" value={totals.totalInjuries} first />
            <TableEntry label="(M2) Skin disorders" value={totals.totalSkinDisorders} />
            <TableEntry label="(M3) Respiratory conditions" value={totals.totalRespiratoryConditions} />
            <TableEntry label="(M4) Poisonings" value={totals.totalPoisonings} />
            <TableEntry label="(M5) Hearing loss" value={totals.totalHearingLoss} />
            <TableEntry label="(M6) All other illnesses" value={totals.totalAllOtherIllnesses} />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Employment Information</Text>
            <View style={styles.tableRowFirst}>
              <View style={styles.tdLabel}>
                <Text>Annual average number of employees</Text>
              </View>
              <View style={[styles.tdValue, { width: 80 }]}>
                <Text>{avgEmployees != null ? avgEmployees.toLocaleString() : "—"}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tdLabel}>
                <Text>Total hours worked by all employees last year</Text>
              </View>
              <View style={[styles.tdValue, { width: 80 }]}>
                <Text>{totalHoursWorked != null ? totalHoursWorked.toLocaleString() : "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Certification */}
        <View style={styles.certBox}>
          <Text style={styles.certTitle}>Certification — 29 CFR 1904.32(b)(3)</Text>
          <Text style={styles.certNote}>
            I certify that I have examined this document and that to the best of my knowledge the entries are true, accurate, and complete.
          </Text>
          {certification ? (
            <View style={styles.certFields}>
              <View style={styles.certField}>
                <Text style={styles.certFieldLabel}>Signature / Name</Text>
                <View style={styles.certFieldValue}>
                  <Text>{certification.signerName}</Text>
                </View>
              </View>
              <View style={styles.certField}>
                <Text style={styles.certFieldLabel}>Title</Text>
                <View style={styles.certFieldValue}>
                  <Text>{certification.signerTitle}</Text>
                </View>
              </View>
              <View style={[styles.certField, { flex: 0.5 }]}>
                <Text style={styles.certFieldLabel}>Date</Text>
                <View style={styles.certFieldValue}>
                  <Text>{new Date(certification.certifiedAt).toLocaleDateString("en-US")}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.certFields}>
              <View style={styles.certField}>
                <Text style={styles.certFieldLabel}>Signature</Text>
                <View style={[styles.certFieldValue, { minHeight: 24 }]}>
                  <Text> </Text>
                </View>
              </View>
              <View style={styles.certField}>
                <Text style={styles.certFieldLabel}>Title</Text>
                <View style={[styles.certFieldValue, { minHeight: 24 }]}>
                  <Text> </Text>
                </View>
              </View>
              <View style={[styles.certField, { flex: 0.5 }]}>
                <Text style={styles.certFieldLabel}>Date</Text>
                <View style={[styles.certFieldValue, { minHeight: 24 }]}>
                  <Text> </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Posting notice */}
        <View style={styles.postingBox}>
          <Text style={styles.postingText}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Posting Requirement — 29 CFR 1904.32(b)(6):
            </Text>{" "}
            This Summary (Form 300A) MUST be posted from February 1 through April 30 ({year + 1}) in a conspicuous place where
            notices to employees are customarily posted. Failure to post may result in citation and penalty.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
