/**
 * React-PDF document for OSHA Form 300 — Log of Work-Related Injuries and Illnesses
 * Legal landscape (14in × 8.5in) per OSHA Form 300 (Rev. 01/2004)
 * 29 CFR 1904.29(b)
 */

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    padding: "0.4in 0.4in 0.3in 0.4in",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  title: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 7, color: "#444", marginTop: 2 },
  headerRight: { textAlign: "right", fontSize: 7 },
  table: { width: "100%", borderStyle: "solid", borderWidth: 1, borderColor: "#000" },
  thead: {
    flexDirection: "row",
    backgroundColor: "#ddd",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 16,
  },
  trPrivacy: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 16,
    backgroundColor: "#fef9c3",
  },
  trDeath: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 16,
    backgroundColor: "#fee2e2",
  },
  trFoot: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    minHeight: 16,
  },
  th: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: "2 3",
    fontFamily: "Helvetica-Bold",
    fontSize: 6,
    justifyContent: "center",
  },
  td: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: "2 3",
    fontSize: 6.5,
  },
  tdCenter: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: "2 3",
    fontSize: 6.5,
    textAlign: "center",
  },
  tdCheck: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: "2 3",
    fontSize: 8,
    textAlign: "center",
    width: 18,
  },
  checkMark: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  legend: {
    marginTop: 4,
    fontSize: 6,
    color: "#444",
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

export type CasePdfRow = {
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

export type EstablishmentPdf = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  naicsCode: string;
  sicCode?: string | null;
};

export interface Form300PdfProps {
  cases: CasePdfRow[];
  establishment: EstablishmentPdf;
  year: number;
}

function Check({ checked }: { checked: boolean }) {
  return <Text style={styles.checkMark}>{checked ? "✓" : ""}</Text>;
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
}

export function Form300Pdf({ cases, establishment, year }: Form300PdfProps) {
  const totals = {
    deaths: cases.filter((c) => c.outcome === "DEATH").length,
    daysAway: cases.filter((c) => c.outcome === "DAYS_AWAY").length,
    restricted: cases.filter((c) => c.outcome === "RESTRICTED_TRANSFER").length,
    other: cases.filter((c) => c.outcome === "OTHER_RECORDABLE").length,
    totalDaysAway: cases.reduce((s, c) => s + c.daysAway, 0),
    totalDaysRestricted: cases.reduce((s, c) => s + c.daysRestricted, 0),
    injury: cases.filter((c) => c.caseType === "INJURY").length,
    skin: cases.filter((c) => c.caseType === "SKIN_DISORDER").length,
    resp: cases.filter((c) => c.caseType === "RESPIRATORY").length,
    poison: cases.filter((c) => c.caseType === "POISONING").length,
    hearing: cases.filter((c) => c.caseType === "HEARING_LOSS").length,
    other_illness: cases.filter((c) => c.caseType === "ALL_OTHER_ILLNESS").length,
  };

  return (
    <Document
      title={`OSHA Form 300 — ${establishment.name} — ${year}`}
      author="OSHA Recordkeeping System"
      subject="Log of Work-Related Injuries and Illnesses"
    >
      <Page size={[1008, 612]} orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Log of Work-Related Injuries and Illnesses</Text>
            <Text style={styles.subtitle}>
              OSHA&apos;s Form 300 (Rev. 01/2004) · 29 CFR 1904.7 · Year {year}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8 }}>{establishment.name}</Text>
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

        {/* Table */}
        <View style={styles.table}>
          {/* Column header row */}
          <View style={styles.thead}>
            <View style={[styles.th, { width: 38 }]}><Text>(A) Case #</Text></View>
            <View style={[styles.th, { width: 80 }]}><Text>(B) Employee Name</Text></View>
            <View style={[styles.th, { width: 62 }]}><Text>(C) Job Title</Text></View>
            <View style={[styles.th, { width: 46 }]}><Text>(D) Date</Text></View>
            <View style={[styles.th, { width: 72 }]}><Text>(E) Where Occurred</Text></View>
            <View style={[styles.th, { flex: 1 }]}><Text>(F) Describe Illness/Injury</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>G</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>H</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>I</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>J</Text></View>
            <View style={[styles.th, { width: 28 }]}><Text>(K) Days Away</Text></View>
            <View style={[styles.th, { width: 28 }]}><Text>(L) Restr.</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>M1</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>M2</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>M3</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>M4</Text></View>
            <View style={[styles.th, { width: 18 }]}><Text>M5</Text></View>
            <View style={[styles.th, { width: 18, borderRightWidth: 0 }]}><Text>M6</Text></View>
          </View>

          {/* Data rows */}
          {cases.map((c) => {
            const rowStyle = c.outcome === "DEATH" ? styles.trDeath : c.isPrivacyCase ? styles.trPrivacy : styles.tr;
            return (
              <View key={c.id} style={rowStyle}>
                <View style={[styles.td, { width: 38, fontFamily: "Courier" }]}><Text>{c.caseNumber}</Text></View>
                <View style={[styles.td, { width: 80, fontStyle: c.isPrivacyCase ? "italic" : "normal" }]}>
                  <Text>{c.isPrivacyCase ? "Privacy Case" : c.employeeName}</Text>
                </View>
                <View style={[styles.td, { width: 62 }]}><Text>{c.isPrivacyCase ? "" : c.employeeJobTitle}</Text></View>
                <View style={[styles.td, { width: 46 }]}><Text>{fmtDate(c.dateOfInjury)}</Text></View>
                <View style={[styles.td, { width: 72 }]}><Text>{c.whereEventOccurred}</Text></View>
                <View style={[styles.td, { flex: 1 }]}><Text>{c.whatHappened}</Text></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.outcome === "DEATH"} /></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.outcome === "DAYS_AWAY"} /></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.outcome === "RESTRICTED_TRANSFER"} /></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.outcome === "OTHER_RECORDABLE"} /></View>
                <View style={[styles.tdCenter, { width: 28 }]}><Text>{c.daysAway > 0 ? String(c.daysAway) : ""}</Text></View>
                <View style={[styles.tdCenter, { width: 28 }]}><Text>{c.daysRestricted > 0 ? String(c.daysRestricted) : ""}</Text></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.caseType === "INJURY"} /></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.caseType === "SKIN_DISORDER"} /></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.caseType === "RESPIRATORY"} /></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.caseType === "POISONING"} /></View>
                <View style={[styles.tdCheck, { width: 18 }]}><Check checked={c.caseType === "HEARING_LOSS"} /></View>
                <View style={[styles.tdCheck, { width: 18, borderRightWidth: 0 }]}><Check checked={c.caseType === "ALL_OTHER_ILLNESS"} /></View>
              </View>
            );
          })}

          {cases.length === 0 && (
            <View style={[styles.tr, { justifyContent: "center", padding: 6 }]}>
              <Text style={{ color: "#666", textAlign: "center" }}>No recordable cases for this period</Text>
            </View>
          )}

          {/* Totals row */}
          <View style={styles.trFoot}>
            <View style={[styles.td, { width: 38, fontFamily: "Helvetica-Bold" }]}><Text>Totals</Text></View>
            <View style={[styles.td, { width: 80 }]}><Text> </Text></View>
            <View style={[styles.td, { width: 62 }]}><Text> </Text></View>
            <View style={[styles.td, { width: 46 }]}><Text> </Text></View>
            <View style={[styles.td, { width: 72 }]}><Text> </Text></View>
            <View style={[styles.td, { flex: 1 }]}><Text> </Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.deaths || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.daysAway || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.restricted || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.other || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 28, fontFamily: "Helvetica-Bold" }]}><Text>{totals.totalDaysAway || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 28, fontFamily: "Helvetica-Bold" }]}><Text>{totals.totalDaysRestricted || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.injury || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.skin || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.resp || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.poison || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, fontFamily: "Helvetica-Bold" }]}><Text>{totals.hearing || ""}</Text></View>
            <View style={[styles.tdCenter, { width: 18, borderRightWidth: 0, fontFamily: "Helvetica-Bold" }]}><Text>{totals.other_illness || ""}</Text></View>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text>G=Death · H=Days Away From Work · I=Restricted/Transfer · J=Other Recordable · </Text>
          <Text>K=Days Away Count · L=Days Restricted Count · </Text>
          <Text>M1=Injury · M2=Skin Disorder · M3=Respiratory · M4=Poisoning · M5=Hearing Loss · M6=Other Illness</Text>
        </View>
      </Page>
    </Document>
  );
}
