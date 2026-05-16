/**
 * Downloads the official OSHA Forms Package from osha.gov (a single 12-page PDF),
 * fills AcroForm fields with real data using pdf-lib, then extracts just the
 * relevant page(s) so each endpoint returns a clean single-form PDF.
 *
 * Field names were discovered via GET /api/pdf/fields/[formType].
 * Page indices (0-based): Form 300 = 6, Form 300A = 7, Form 301 = 9.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const OSHA_PACKAGE_URL =
  "https://www.osha.gov/sites/default/files/OSHA-RK-Forms-Package.pdf";

// Page indices (0-based) of each form within the 12-page package
const FORM_PAGES = {
  "300": 6,
  "300a": 7,
  "301": 9,
} as const;

// In-process cache — fetch the package only once per server lifetime
let packageCache: Uint8Array | null = null;

async function fetchPackage(): Promise<Uint8Array> {
  if (packageCache) return packageCache;
  const res = await fetch(OSHA_PACKAGE_URL, {
    headers: { "User-Agent": "OSHA-Recordkeeping-App/1.0" },
    redirect: "follow",
    next: { revalidate: 86400 },
  });
  if (!res.ok)
    throw new Error(
      `Could not fetch OSHA Forms Package from osha.gov (status ${res.status})`
    );
  packageCache = new Uint8Array(await res.arrayBuffer());
  return packageCache;
}

/** Returns all AcroForm field names from the OSHA package PDF. Used for debugging. */
export async function listFields(
  _form?: "300a" | "300" | "301"
): Promise<{ name: string; type: string }[]> {
  const bytes = await fetchPackage();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc
    .getForm()
    .getFields()
    .map((f) => ({ name: f.getName(), type: f.constructor.name }));
}

/**
 * Loads the package PDF, fills the relevant fields, optionally flattens
 * (making the PDF permanently read-only), then removes every page except
 * the target form page.
 *
 * IMPORTANT: flatten() must be called BEFORE removing pages. Widgets contain
 * references to their parent pages; removing pages first orphans those refs
 * and causes flatten() to throw "Could not find page for PDFRef".
 *
 * @param lock - When true: embed Helvetica, regenerate appearances, then
 *               flatten — output is a clean, read-only static PDF.
 *               When false: the AcroForm stays interactive (editable view).
 */
async function buildFormPdf(
  fillFn: (form: ReturnType<PDFDocument["getForm"]>) => void,
  keepPage: number,
  lock: boolean
): Promise<Uint8Array> {
  const bytes = await fetchPackage();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  fillFn(doc.getForm());

  if (lock) {
    // Regenerate all field appearance streams with Helvetica so the
    // rendered text is clean and consistently sized before flattening.
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    doc.getForm().updateFieldAppearances(helvetica);
    // Flatten converts every widget annotation into static page content.
    // All 12 pages are still present here, so every widget's /P page
    // reference resolves without error.
    doc.getForm().flatten();

    // Only remove pages after flatten — removing pages while widgets still
    // reference them via /P entries causes "Could not find page for PDFRef".
    const total = doc.getPageCount();
    for (let i = total - 1; i >= 0; i--) {
      if (i !== keepPage) doc.removePage(i);
    }
  }

  return doc.save();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type PdfForm = ReturnType<PDFDocument["getForm"]>;

function setText(
  form: PdfForm,
  name: string,
  value: string | number | null | undefined
) {
  try {
    form.getTextField(name).setText(value != null ? String(value) : "");
  } catch {
    // field absent — skip silently
  }
}

function selectRadio(form: PdfForm, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    form.getRadioGroup(name).select(value);
  } catch {
    // field absent or value not in options — skip silently
  }
}

// ── Form 300A ─────────────────────────────────────────────────────────────────

export type Data300A = {
  establishment: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    naicsCode: string;
    sicCode?: string | null;
    industryDescription?: string | null;
    phone?: string | null;
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

// Fields to black-out when producing a redacted 300A PDF
const REDACT_FIELDS_300A = [
  "Summary of Injury/Illness Establishment Name",
  "Summary of Injury/Illness Street",
  "Summary of Injury/Illness City",
  "Summary of Injury/Illness State",
  "Summary of Injury/Illness Zip",
  "Summary of Injury/Illness NAICS",
  "Summary of Injury/Illness Industry description",
  "Summary of Injury/Illness Phone",
];

export async function fill300A(data: Data300A, lock = false, redact = false): Promise<Uint8Array> {
  const bytes = await fetchPackage();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();

  // ── Fill all fields with real data ────────────────────────────────────────
  setText(form, "Summary of Injury/Illness Year", String(data.year).slice(-2));
  setText(form, "Summary of Injury/Illness Establishment Name", data.establishment.name);
  setText(form, "Summary of Injury/Illness Street", data.establishment.street);
  setText(form, "Summary of Injury/Illness City", data.establishment.city);
  setText(form, "Summary of Injury/Illness State", data.establishment.state);
  setText(form, "Summary of Injury/Illness Zip", data.establishment.zip);
  setText(form, "Summary of Injury/Illness NAICS", data.establishment.naicsCode);
  setText(form, "Summary of Injury/Illness Industry description", data.establishment.industryDescription ?? "");
  setText(form, "Summary of Injury/Illness Phone", data.establishment.phone ?? "");
  setText(form, "Summary of Injury/Illness Annual avg num of employees", data.avgEmployees ?? "");
  setText(form, "Summary of Injury/Illness Total hours worked by all employees last year", data.totalHoursWorked ?? "");

  setText(form, "Total Deaths Summary", data.totals.totalDeaths);
  setText(form, "Days away from work Summary", data.totals.totalDaysAwayFromWork);
  setText(form, "Job transfer or restriction Summary", data.totals.totalJobTransferOrRestriction);
  setText(form, "Other recordable cases Summary", data.totals.totalOtherRecordable);
  setText(form, "Number of days injured or ill away from work Summary", data.totals.totalDaysAway);
  setText(form, "On job transfer or restriction Summary", data.totals.totalDaysRestricted);
  setText(form, "Injury Summary", data.totals.totalInjuries);
  setText(form, "Skin Disorder Summary", data.totals.totalSkinDisorders);
  setText(form, "Respiratory Cond Summary", data.totals.totalRespiratoryConditions);
  setText(form, "Poisoning Summary", data.totals.totalPoisonings);
  setText(form, "Hearing Loss Summary", data.totals.totalHearingLoss);
  setText(form, "All other Summary", data.totals.totalAllOtherIllnesses);

  if (data.certification) {
    setText(form, "Summary of Injury/Illness Date",
      new Date(data.certification.certifiedAt).toLocaleDateString("en-US"));
  }

  // ── Collect widget positions for redaction BEFORE flattening ──────────────
  type Rect = { x: number; y: number; width: number; height: number };
  const redactRects: Rect[] = [];
  if (redact) {
    for (const fieldName of REDACT_FIELDS_300A) {
      try {
        const field = form.getTextField(fieldName);
        for (const widget of field.acroField.getWidgets()) {
          redactRects.push(widget.getRectangle());
        }
      } catch { /* field absent */ }
    }
  }

  // ── Flatten + page removal (only when locking/redacting) ─────────────────
  // Removing pages while AcroForm widgets still reference them via /P entries
  // causes "Could not find page for PDFRef". Always flatten first, then prune.
  const shouldLock = lock || redact;
  let helvetica = null as Awaited<ReturnType<typeof doc.embedFont>> | null;
  if (shouldLock) {
    helvetica = await doc.embedFont(StandardFonts.Helvetica);
    doc.getForm().updateFieldAppearances(helvetica);
    doc.getForm().flatten();

    const total = doc.getPageCount();
    for (let i = total - 1; i >= 0; i--) {
      if (i !== FORM_PAGES["300a"]) doc.removePage(i);
    }
  }

  // ── Draw professional black redaction boxes ───────────────────────────────
  if (redact && redactRects.length > 0) {
    const page = doc.getPage(0); // 300a is now the only page
    const font = helvetica ?? await doc.embedFont(StandardFonts.Helvetica);
    for (const rect of redactRects) {
      // Solid black box covers the underlying text permanently
      page.drawRectangle({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        color: rgb(0, 0, 0),
      });
      // White "REDACTED" label inside the box
      const fontSize = Math.max(6, Math.min(9, rect.height - 3));
      page.drawText("REDACTED", {
        x: rect.x + 3,
        y: rect.y + (rect.height - fontSize) / 2,
        size: fontSize,
        font,
        color: rgb(1, 1, 1),
      });
    }
  }

  return doc.save();
}

// ── Form 300 ─────────────────────────────────────────────────────────────────

export type CaseRow300 = {
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

export type Data300 = {
  establishment: {
    name: string;
    city: string;
    state: string;
    naicsCode?: string | null;
  };
  year: number;
  cases: CaseRow300[];
};

// Maps DB outcome values to the radio option labels in the actual PDF
const OUTCOME_RADIO: Record<string, string> = {
  DEATH: "Death",
  DAYS_AWAY: "Days away from work",
  RESTRICTED_TRANSFER: "Job transfer or restriction",
  OTHER_RECORDABLE: "Other recordable cases",
};

// Maps DB case type values to the radio option labels in the actual PDF
const CASE_TYPE_RADIO: Record<string, string> = {
  INJURY: "Injury",
  SKIN_DISORDER: "Skin Disorder",
  RESPIRATORY: "Respiratory Cond",
  POISONING: "Poisoning",
  HEARING_LOSS: "Hearing Loss",
  ALL_OTHER_ILLNESS: "All other",
};

export async function fill300(data: Data300, lock = false): Promise<Uint8Array> {
  return buildFormPdf((form) => {
    // The 300 log has "Year 20__" preprinted — fill only the 2-digit suffix
    setText(form, "Log of Injury/Illness Year", String(data.year).slice(-2));
    setText(form, "Log of Injury/Illness Establishment name", data.establishment.name);
    setText(form, "Log of Injury/Illness City", data.establishment.city);
    setText(form, "Log of Injury/Illness State", data.establishment.state);

    // Case rows 1–10 (one page capacity)
    data.cases.slice(0, 10).forEach((c, i) => {
      const n = i + 1;
      const d = new Date(c.dateOfInjury);
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      setText(form, `Case No. ${n}`, c.caseNumber);
      setText(form, `Employee's Name ${n}`, c.isPrivacyCase ? "Privacy Case" : c.employeeName);
      setText(form, `Job Title ${n}`, c.employeeJobTitle);
      setText(form, `Date of injury or Illness month ${n}`, month);
      setText(form, `Date of injury or illness day ${n}`, day);
      setText(form, `Where the Event Occurred ${n}`, c.whereEventOccurred);
      setText(form, `Injury or Illness Description ${n}`, c.isPrivacyCase ? "Description withheld" : c.whatHappened);

      if (c.daysAway > 0)
        setText(form, `Number of days injured or ill away from work ${n}`, c.daysAway);
      if (c.daysRestricted > 0)
        setText(form, `On job transfer or restriction ${n}`, c.daysRestricted);

      selectRadio(form, `Group${n}`, OUTCOME_RADIO[c.outcome] ?? null);
      selectRadio(form, `Group${n}a`, CASE_TYPE_RADIO[c.caseType] ?? null);
    });

    // Column totals at the bottom of the 300 log page
    const rows = data.cases;
    setText(form, "Death Total",
      rows.filter((c) => c.outcome === "DEATH").length);
    setText(form, "Days away from work Total",
      rows.filter((c) => c.outcome === "DAYS_AWAY").length);
    setText(form, "Job transfer or restriction Total",
      rows.filter((c) => c.outcome === "RESTRICTED_TRANSFER").length);
    setText(form, "Other recordable cases Total",
      rows.filter((c) => c.outcome === "OTHER_RECORDABLE").length);
    setText(form, "Number of days injured or ill away from work Total",
      rows.reduce((s, c) => s + c.daysAway, 0));
    setText(form, "On job transfer or restriction Total",
      rows.reduce((s, c) => s + c.daysRestricted, 0));
    setText(form, "Injury Total",
      rows.filter((c) => c.caseType === "INJURY").length);
    setText(form, "Skin Disorder Total",
      rows.filter((c) => c.caseType === "SKIN_DISORDER").length);
    setText(form, "Respiratory Cond Total",
      rows.filter((c) => c.caseType === "RESPIRATORY").length);
    setText(form, "Poisoning Total",
      rows.filter((c) => c.caseType === "POISONING").length);
    // Note: "Hearling Loss Total" is a typo in the official OSHA PDF — must match exactly
    setText(form, "Hearling Loss Total",
      rows.filter((c) => c.caseType === "HEARING_LOSS").length);
    setText(form, "All other Total",
      rows.filter((c) => c.caseType === "ALL_OTHER_ILLNESS").length);
  }, FORM_PAGES["300"], lock);
}

// ── Form 301 ─────────────────────────────────────────────────────────────────

export type Data301 = {
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
};

export async function fill301(data: Data301, lock = false): Promise<Uint8Array> {
  const fmt = (d: Date | string | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
      : "";

  return buildFormPdf((form) => {
    setText(form, "301 Case Number", data.caseNumber);

    // Employee
    setText(form, "301 Full name", data.isPrivacyCase ? "Privacy Case" : data.employeeName);
    setText(form, "301 Address Street", data.employeeStreet ?? "");
    setText(form, "301 Address City", data.employeeCity ?? "");
    setText(form, "301 Address State", data.employeeState ?? "");
    setText(form, "301 Address Zip", data.employeeZip ?? "");
    setText(form, "301 DOB", fmt(data.employeeDOB));
    setText(form, "301 Date Hired", fmt(data.employeeHireDate));

    // Medical treatment
    selectRadio(form, "301 ER", data.treatedInEmergencyRoom ? "Yes" : "No");
    selectRadio(form, "301 Hospitalized", data.hospitalizedOvernight ? "Yes" : "No");
    setText(form, "301 Name of Doctor", data.physicianName ?? "");
    setText(form, "301 Facility Name", data.facilityName ?? "");
    setText(form, "301 Facility Address Street", data.facilityStreet ?? "");
    setText(form, "301 Facility Address City", data.facilityCity ?? "");
    setText(form, "301 Facility Address State", data.facilityState ?? "");
    setText(form, "301 Facility Address Zip", data.facilityZip ?? "");

    // Incident
    setText(form, "301 Date of Injury or Illness", fmt(data.dateOfInjury));
    setText(form, "301 Time of event", data.timeOfInjury ?? "");
    setText(form, "301 Activity Prior to Event", data.whatEmployeeWasDoing);
    setText(form, "301 What Happened",
      data.isPrivacyCase ? "Description withheld" : data.whatHappened
    );
    setText(form, "301 Describe Injury or Illness", data.bodyPartAffected);
    setText(form, "301 What Harmed Employee", data.objectOrSubstance);
  }, FORM_PAGES["301"], lock);
}
