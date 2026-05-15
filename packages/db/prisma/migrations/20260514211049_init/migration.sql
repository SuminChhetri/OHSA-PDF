-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RECORDKEEPER',
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "establishments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "naicsCode" TEXT NOT NULL,
    "sicCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reporting_years" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "establishmentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "avgEmployees" INTEGER,
    "totalHoursWorked" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reporting_years_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "reportingYearId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeJobTitle" TEXT NOT NULL,
    "employeeDOB" DATETIME,
    "employeeHireDate" DATETIME,
    "employeeStreet" TEXT,
    "employeeCity" TEXT,
    "employeeState" TEXT,
    "employeeZip" TEXT,
    "dateOfInjury" DATETIME NOT NULL,
    "timeOfInjury" TEXT,
    "whereEventOccurred" TEXT NOT NULL,
    "whatEmployeeWasDoing" TEXT NOT NULL,
    "whatHappened" TEXT NOT NULL,
    "bodyPartAffected" TEXT NOT NULL,
    "objectOrSubstance" TEXT NOT NULL,
    "treatedInEmergencyRoom" BOOLEAN NOT NULL DEFAULT false,
    "hospitalizedOvernight" BOOLEAN NOT NULL DEFAULT false,
    "physicianName" TEXT,
    "facilityName" TEXT,
    "facilityStreet" TEXT,
    "facilityCity" TEXT,
    "facilityState" TEXT,
    "facilityZip" TEXT,
    "isPrivacyCase" BOOLEAN NOT NULL DEFAULT false,
    "privacyReason" TEXT,
    "outcome" TEXT NOT NULL,
    "daysAway" INTEGER NOT NULL DEFAULT 0,
    "daysRestricted" INTEGER NOT NULL DEFAULT 0,
    "caseType" TEXT NOT NULL,
    "isRecordable" BOOLEAN NOT NULL DEFAULT true,
    "wizardAnswers" TEXT,
    "severityLevel" TEXT,
    "severeReportedAt" DATETIME,
    "severeReportMethod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "cases_reportingYearId_fkey" FOREIGN KEY ("reportingYearId") REFERENCES "reporting_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certification_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportingYearId" TEXT NOT NULL,
    "certifiedById" TEXT NOT NULL,
    "certifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT NOT NULL,
    CONSTRAINT "certification_records_reportingYearId_fkey" FOREIGN KEY ("reportingYearId") REFERENCES "reporting_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "certification_records_certifiedById_fkey" FOREIGN KEY ("certifiedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT,
    CONSTRAINT "audit_logs_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "naics_codes" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "isAppendixASubpartB" BOOLEAN NOT NULL DEFAULT false,
    "isAppendixBSubpartE" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reporting_years_establishmentId_year_key" ON "reporting_years"("establishmentId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "cases_reportingYearId_caseNumber_key" ON "cases"("reportingYearId", "caseNumber");
