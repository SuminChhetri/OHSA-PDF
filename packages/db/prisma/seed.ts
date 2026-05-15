/**
 * Database seed for the OSHA Recordkeeping application.
 *
 * Seeds:
 *  1. NAICS codes from Appendix A (Subpart B) and Appendix B (Subpart E)
 *  2. A system admin user + a recordkeeper user
 *  3. One fictional establishment — Acme Industrial Supply Co.
 *  4. One reporting year (prior year) with five sample cases covering all
 *     classification types, including one privacy case, so a new user can
 *     see the system working immediately.
 *
 * Sample cases:
 *  Case 1 — Death (col G): Forklift operator fatality
 *  Case 2 — Days Away from Work (col H): Back strain, 14 days away
 *  Case 3 — Job Transfer or Restriction (col I): Hand laceration, 5 restricted days
 *  Case 4 — Other Recordable (col J): Eye irritation, prescription eyedrops
 *  Case 5 — Privacy case (needlestick + OPIM): Healthcare worker sharps injury
 */

import { PrismaClient } from "@prisma/client";
import {
  APPENDIX_A_SUBPART_B_EXEMPT,
  APPENDIX_B_SUBPART_E_300_301,
} from "../../regulatory-logic/src/naics-data.js";

const prisma = new PrismaClient();

// Simple deterministic hash for demo passwords — NEVER use in production
function demoHash(plain: string): string {
  return `DEMO_HASH:${plain}:NOT_FOR_PRODUCTION`;
}

async function main() {
  console.log("🌱 Seeding OSHA Recordkeeping database...");

  // ── 1. NAICS Codes ──────────────────────────────────────────────────────────

  console.log("  → Seeding NAICS codes...");

  // Upsert all Appendix A (Subpart B) codes
  for (const entry of APPENDIX_A_SUBPART_B_EXEMPT) {
    await prisma.naicsCode.upsert({
      where: { code: entry.code },
      update: { title: entry.title, isAppendixASubpartB: true },
      create: {
        code: entry.code,
        title: entry.title,
        isAppendixASubpartB: true,
        isAppendixBSubpartE: false,
      },
    });
  }

  // Upsert all Appendix B (Subpart E) codes
  for (const entry of APPENDIX_B_SUBPART_E_300_301) {
    await prisma.naicsCode.upsert({
      where: { code: entry.code },
      update: { title: entry.title, isAppendixBSubpartE: true },
      create: {
        code: entry.code,
        title: entry.title,
        isAppendixASubpartB: false,
        isAppendixBSubpartE: true,
      },
    });
  }

  console.log(
    `     ✓ ${APPENDIX_A_SUBPART_B_EXEMPT.length} Appendix A (Subpart B) codes` +
      ` + ${APPENDIX_B_SUBPART_E_300_301.length} Appendix B (Subpart E) codes`
  );

  // ── 2. Users ─────────────────────────────────────────────────────────────────

  console.log("  → Seeding users...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@acme-industrial.example" },
    update: {},
    create: {
      email: "admin@acme-industrial.example",
      name: "System Administrator",
      role: "ADMIN",
      passwordHash: demoHash("Admin1234!"),
    },
  });

  const recordkeeper = await prisma.user.upsert({
    where: { email: "safety@acme-industrial.example" },
    update: {},
    create: {
      email: "safety@acme-industrial.example",
      name: "Jordan Smith",
      role: "RECORDKEEPER",
      passwordHash: demoHash("Safety1234!"),
    },
  });

  const executive = await prisma.user.upsert({
    where: { email: "vp-ops@acme-industrial.example" },
    update: {},
    create: {
      email: "vp-ops@acme-industrial.example",
      name: "Taylor Anderson",
      role: "EXECUTIVE",
      passwordHash: demoHash("Exec1234!"),
    },
  });

  console.log("     ✓ admin, recordkeeper, executive users created");

  // ── 3. Establishment ──────────────────────────────────────────────────────────
  // NAICS 3329 = Other Fabricated Metal Product Manufacturing (not Appendix A exempt,
  // not Appendix B, so 300A-only if 250+ employees or flagged if 20-249).

  console.log("  → Seeding establishment...");

  const establishment = await prisma.establishment.upsert({
    where: { id: "seed-establishment-001" },
    update: {},
    create: {
      id: "seed-establishment-001",
      name: "Acme Industrial Supply Co.",
      street: "1450 Commerce Drive",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      naicsCode: "3329",
      sicCode: "3490",
    },
  });

  console.log(`     ✓ Establishment: ${establishment.name}`);

  // ── 4. Reporting Year ─────────────────────────────────────────────────────────

  const priorYear = new Date().getUTCFullYear() - 1;

  const reportingYear = await prisma.reportingYear.upsert({
    where: {
      establishmentId_year: {
        establishmentId: establishment.id,
        year: priorYear,
      },
    },
    update: {},
    create: {
      establishmentId: establishment.id,
      year: priorYear,
      avgEmployees: 87,
      totalHoursWorked: 181000,
    },
  });

  console.log(`     ✓ Reporting year: ${priorYear} (87 avg employees, 181,000 hours worked)`);

  // ── 5. Sample Cases ───────────────────────────────────────────────────────────

  console.log("  → Seeding sample cases...");

  // Helper: date within the reporting year
  function inYear(month: number, day: number): string {
    return new Date(Date.UTC(priorYear, month - 1, day)).toISOString();
  }

  const SYSTEM_USER_ID = admin.id;
  const RK_USER_ID = recordkeeper.id;

  // ── Case 1: Death — Forklift operator fatality
  // Classification: col G (Death), CaseType: INJURY (M1)
  // 1904.39: fatality must be reported to OSHA within 8 hours.

  await prisma.case.upsert({
    where: {
      reportingYearId_caseNumber: {
        reportingYearId: reportingYear.id,
        caseNumber: `${priorYear}-001`,
      },
    },
    update: {},
    create: {
      reportingYearId: reportingYear.id,
      caseNumber: `${priorYear}-001`,
      employeeName: "Marcus Webb",
      employeeJobTitle: "Forklift Operator",
      employeeDOB: new Date("1978-04-12"),
      employeeHireDate: new Date("2018-06-01"),
      employeeStreet: "312 Maple Street",
      employeeCity: "Springfield",
      employeeState: "IL",
      employeeZip: "62702",
      dateOfInjury: new Date(inYear(3, 14)),
      timeOfInjury: "09:45",
      whereEventOccurred: "Warehouse floor, aisle 7 near loading dock B",
      whatEmployeeWasDoing: "Operating a sit-down counterbalanced forklift, traveling with a loaded pallet at 8 mph",
      whatHappened: "Forklift struck a floor-level structural column due to obscured sightline from load; employee ejected and fatally crushed under the overhead guard when vehicle tipped. Emergency services arrived within 9 minutes but employee was pronounced dead at scene.",
      bodyPartAffected: "Head and torso",
      objectOrSubstance: "Forklift overhead guard and concrete floor",
      treatedInEmergencyRoom: false,
      hospitalizedOvernight: false,
      isPrivacyCase: false,
      outcome: "DEATH",
      daysAway: 0,
      daysRestricted: 0,
      caseType: "INJURY",
      isRecordable: true,
      severityLevel: "FATALITY",
      severeReportedAt: new Date(inYear(3, 14)),
      severeReportMethod: "PHONE",
      createdById: RK_USER_ID,
      updatedById: RK_USER_ID,
    },
  });

  // ── Case 2: Days Away from Work — Back strain
  // Classification: col H (Days Away), CaseType: INJURY (M1)
  // 14 calendar days away per physician recommendation. Day of injury not counted.

  await prisma.case.upsert({
    where: {
      reportingYearId_caseNumber: {
        reportingYearId: reportingYear.id,
        caseNumber: `${priorYear}-002`,
      },
    },
    update: {},
    create: {
      reportingYearId: reportingYear.id,
      caseNumber: `${priorYear}-002`,
      employeeName: "Sandra Torres",
      employeeJobTitle: "Warehouse Associate",
      employeeDOB: new Date("1990-11-03"),
      employeeHireDate: new Date("2021-02-15"),
      employeeStreet: "88 Oak Avenue",
      employeeCity: "Springfield",
      employeeState: "IL",
      employeeZip: "62703",
      dateOfInjury: new Date(inYear(5, 8)),
      timeOfInjury: "14:20",
      whereEventOccurred: "Receiving dock — unloading area",
      whatEmployeeWasDoing: "Manually unloading 50-lb boxes from a delivery trailer without mechanical assist",
      whatHappened: "Employee felt acute lower back pain while lifting and rotating to place box on cart. Reported pain immediately to supervisor. Sent to occupational health clinic; X-ray negative for fracture. Diagnosed with lumbar muscle strain. Physician ordered 14 calendar days away from work.",
      bodyPartAffected: "Lower back (lumbar region)",
      objectOrSubstance: "Cardboard shipping box (approx. 50 lbs)",
      treatedInEmergencyRoom: false,
      hospitalizedOvernight: false,
      physicianName: "Dr. Renee Nguyen, DO",
      facilityName: "Springfield Occupational Health Clinic",
      facilityStreet: "2200 Health Parkway",
      facilityCity: "Springfield",
      facilityState: "IL",
      facilityZip: "62704",
      isPrivacyCase: false,
      outcome: "DAYS_AWAY",
      // 14 calendar days beginning the day after injury (day of injury excluded per 1904.7(b)(3)(i))
      daysAway: 14,
      daysRestricted: 0,
      caseType: "INJURY",
      isRecordable: true,
      createdById: RK_USER_ID,
      updatedById: RK_USER_ID,
    },
  });

  // ── Case 3: Job Transfer/Restriction — Hand laceration
  // Classification: col I (Restricted/Transfer), CaseType: INJURY (M1)
  // No days away; physician ordered 5 days of restricted duty (no gripping/lifting).

  await prisma.case.upsert({
    where: {
      reportingYearId_caseNumber: {
        reportingYearId: reportingYear.id,
        caseNumber: `${priorYear}-003`,
      },
    },
    update: {},
    create: {
      reportingYearId: reportingYear.id,
      caseNumber: `${priorYear}-003`,
      employeeName: "Darnell Okafor",
      employeeJobTitle: "Metal Fabricator",
      employeeDOB: new Date("1985-07-22"),
      employeeHireDate: new Date("2016-09-12"),
      employeeStreet: "45 Birch Lane",
      employeeCity: "Springfield",
      employeeState: "IL",
      employeeZip: "62705",
      dateOfInjury: new Date(inYear(7, 19)),
      timeOfInjury: "10:05",
      whereEventOccurred: "Metal fabrication shop — press brake station",
      whatEmployeeWasDoing: "Removing a finished metal part from the press brake die",
      whatHappened: "Employee's left hand slipped on a sharp burr on the part edge, causing a 2.5 cm laceration on the palm. Wound required four sutures at clinic. Physician cleared employee to return to work the next day with restriction: no repetitive gripping or lifting over 5 lbs with left hand for 5 calendar days.",
      bodyPartAffected: "Left palm (hand)",
      objectOrSubstance: "Sheet metal part with sharp burr edge",
      treatedInEmergencyRoom: false,
      hospitalizedOvernight: false,
      physicianName: "Dr. Patricia Huang, MD",
      facilityName: "Urgent Care Plus",
      facilityStreet: "901 Medical Row",
      facilityCity: "Springfield",
      facilityState: "IL",
      facilityZip: "62701",
      isPrivacyCase: false,
      outcome: "RESTRICTED_TRANSFER",
      daysAway: 0,
      // 5 calendar days of restricted duty per physician. 1904.7(b)(3).
      daysRestricted: 5,
      caseType: "INJURY",
      isRecordable: true,
      createdById: RK_USER_ID,
      updatedById: RK_USER_ID,
    },
  });

  // ── Case 4: Other Recordable — Eye irritation with prescription eyedrops
  // Classification: col J (Other Recordable), CaseType: ALL_OTHER_ILLNESS (M6)
  // No days away or restriction; recordable because prescription medication was
  // required (beyond first aid per 1904.7(b)(5)(ii)(A): only non-prescription
  // meds at non-prescription strength are first aid).

  await prisma.case.upsert({
    where: {
      reportingYearId_caseNumber: {
        reportingYearId: reportingYear.id,
        caseNumber: `${priorYear}-004`,
      },
    },
    update: {},
    create: {
      reportingYearId: reportingYear.id,
      caseNumber: `${priorYear}-004`,
      employeeName: "Priya Mehta",
      employeeJobTitle: "Quality Control Inspector",
      employeeDOB: new Date("1995-02-14"),
      employeeHireDate: new Date("2022-11-01"),
      employeeStreet: "167 Elm Court",
      employeeCity: "Springfield",
      employeeState: "IL",
      employeeZip: "62702",
      dateOfInjury: new Date(inYear(9, 3)),
      timeOfInjury: "11:30",
      whereEventOccurred: "Quality control inspection station — metalworking fluid area",
      whatEmployeeWasDoing: "Visually inspecting machined parts without appropriate splash goggles (goggles removed for clarity)",
      whatHappened: "Metalworking fluid splash contacted both eyes while employee was leaning over a coolant-flooded part during inspection. Eyes immediately irrigated at the eyewash station for 15 minutes. Sent to occupational health. Physician diagnosed mild chemical conjunctivitis and prescribed antibiotic eye drops (tobramycin ophthalmic solution, Rx-only). No days away or restriction. Returned to full duty same day.",
      bodyPartAffected: "Both eyes (conjunctiva)",
      objectOrSubstance: "Metalworking fluid (water-soluble coolant)",
      treatedInEmergencyRoom: false,
      hospitalizedOvernight: false,
      physicianName: "Dr. Marcus Lee, OD",
      facilityName: "Springfield Occupational Health Clinic",
      facilityStreet: "2200 Health Parkway",
      facilityCity: "Springfield",
      facilityState: "IL",
      facilityZip: "62704",
      isPrivacyCase: false,
      // Recordable because prescription antibiotic eye drops were administered.
      // Irrigation alone would be first aid (1904.7(b)(5)(ii)(C)), but prescription
      // medication is beyond first aid (1904.7(b)(5)(ii)(A) only covers non-prescription
      // medications at non-prescription strength).
      outcome: "OTHER_RECORDABLE",
      daysAway: 0,
      daysRestricted: 0,
      caseType: "ALL_OTHER_ILLNESS",
      isRecordable: true,
      createdById: RK_USER_ID,
      updatedById: RK_USER_ID,
    },
  });

  // ── Case 5: Privacy Case — Needlestick / sharps contaminated with blood (OPIM)
  // Classification: col J (Other Recordable — no days away or restriction),
  // CaseType: ALL_OTHER_ILLNESS (M6)
  // Privacy: mandatory per 1904.29(b)(7)(v) — needlestick contaminated with blood.
  // 300 Log will show "privacy case" instead of employee name.
  // 1904.8: automatically recordable regardless of treatment.

  await prisma.case.upsert({
    where: {
      reportingYearId_caseNumber: {
        reportingYearId: reportingYear.id,
        caseNumber: `${priorYear}-005`,
      },
    },
    update: {},
    create: {
      reportingYearId: reportingYear.id,
      caseNumber: `${priorYear}-005`,
      employeeName: "Alex Rivera", // Stored in DB, hidden on 300 Log — 1904.29(b)(6)
      employeeJobTitle: "First Aid/CPR Responder (Designated)",
      employeeDOB: new Date("1988-09-30"),
      employeeHireDate: new Date("2019-04-20"),
      employeeStreet: "233 Cedar Road",
      employeeCity: "Springfield",
      employeeState: "IL",
      employeeZip: "62703",
      dateOfInjury: new Date(inYear(11, 5)),
      timeOfInjury: "08:15",
      // Sanitized description for 300 Log per 1904.29(b)(9) — does not identify employee
      whereEventOccurred: "On-site first aid room",
      whatEmployeeWasDoing: "Disposing of used sharps from a blood glucose monitoring kit used for an injured coworker",
      whatHappened: "Needlestick injury — description withheld per 1904.29(b)(9)",
      bodyPartAffected: "Right index finger",
      objectOrSubstance: "Contaminated lancet",
      treatedInEmergencyRoom: true,
      hospitalizedOvernight: false,
      physicianName: "Dr. Okonkwo, MD",
      facilityName: "Memorial Hospital ER",
      facilityStreet: "500 Hospital Drive",
      facilityCity: "Springfield",
      facilityState: "IL",
      facilityZip: "62701",
      // Privacy case — mandatory per 1904.29(b)(7)(v): needlestick contaminated with blood
      isPrivacyCase: true,
      privacyReason: "NEEDLESTICK",
      // Automatically recordable per 1904.8 regardless of medical treatment.
      outcome: "OTHER_RECORDABLE",
      daysAway: 0,
      daysRestricted: 0,
      caseType: "ALL_OTHER_ILLNESS",
      isRecordable: true,
      createdById: RK_USER_ID,
      updatedById: RK_USER_ID,
    },
  });

  console.log("     ✓ 5 sample cases created:");
  console.log("       001 — Death / Forklift fatality (col G, M1)");
  console.log("       002 — Days Away 14d / Back strain (col H, M1)");
  console.log("       003 — Restricted 5d / Hand laceration (col I, M1)");
  console.log("       004 — Other Recordable / Eye irritation + Rx drops (col J, M6)");
  console.log("       005 — Privacy case / Needlestick (col J, M6, 1904.8)");

  // ── 6. Audit log entries for the seed cases ──────────────────────────────────

  // Verify cases are in DB
  const cases = await prisma.case.findMany({
    where: { reportingYearId: reportingYear.id },
    orderBy: { caseNumber: "asc" },
  });

  for (const c of cases) {
    await prisma.auditLog.create({
      data: {
        userId: RK_USER_ID,
        action: "CREATE",
        entityType: "Case",
        entityId: c.id,
        caseId: c.id,
        before: null,
        after: JSON.stringify({ caseNumber: c.caseNumber, outcome: c.outcome }),
        reason: "Initial case entry (seed data)",
        ipAddress: "127.0.0.1",
      },
    });
  }

  // Privacy case VIEW_PRIVACY log — demonstrates the audit trail requirement
  const privacyCase = cases.find((c) => c.isPrivacyCase);
  if (privacyCase) {
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "VIEW_PRIVACY",
        entityType: "Case",
        entityId: privacyCase.id,
        caseId: privacyCase.id,
        reason: "Administrative review of confidential privacy case roster",
        ipAddress: "127.0.0.1",
      },
    });
  }

  console.log("     ✓ Audit log entries created for all seed cases");

  // ── 7. 300A Certification ─────────────────────────────────────────────────────
  // Demonstrates the certification requirement per 1904.32(b)(3).

  await prisma.certificationRecord.create({
    data: {
      reportingYearId: reportingYear.id,
      certifiedById: executive.id,
      signerName: "Taylor Anderson",
      signerTitle: "Vice President, Operations",
    },
  });

  console.log("     ✓ 300A certification record created (Taylor Anderson, VP Operations)");

  console.log("\n✅ Seed complete.");
  console.log(`\nEstablishment: ${establishment.name}`);
  console.log(`Reporting year: ${priorYear}`);
  console.log(`Cases: ${cases.length} (including 1 privacy case)`);
  console.log("\nDemo credentials:");
  console.log("  admin@acme-industrial.example      / Admin1234!   (ADMIN)");
  console.log("  safety@acme-industrial.example     / Safety1234!  (RECORDKEEPER)");
  console.log("  vp-ops@acme-industrial.example     / Exec1234!    (EXECUTIVE)");
  console.log("\n⚠️  Demo passwords are NOT secure. Replace before production use.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
