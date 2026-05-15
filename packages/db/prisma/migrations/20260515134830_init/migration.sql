-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RECORDKEEPER',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establishments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "naicsCode" TEXT NOT NULL,
    "sicCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_years" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "avgEmployees" INTEGER,
    "totalHoursWorked" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reporting_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "reportingYearId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeJobTitle" TEXT NOT NULL,
    "employeeDOB" TIMESTAMP(3),
    "employeeHireDate" TIMESTAMP(3),
    "employeeStreet" TEXT,
    "employeeCity" TEXT,
    "employeeState" TEXT,
    "employeeZip" TEXT,
    "dateOfInjury" TIMESTAMP(3) NOT NULL,
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
    "severeReportedAt" TIMESTAMP(3),
    "severeReportMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_records" (
    "id" TEXT NOT NULL,
    "reportingYearId" TEXT NOT NULL,
    "certifiedById" TEXT NOT NULL,
    "certifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT NOT NULL,

    CONSTRAINT "certification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "naics_codes" (
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isAppendixASubpartB" BOOLEAN NOT NULL DEFAULT false,
    "isAppendixBSubpartE" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "naics_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "establishment_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "establishment_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reporting_years_establishmentId_year_key" ON "reporting_years"("establishmentId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "cases_reportingYearId_caseNumber_key" ON "cases"("reportingYearId", "caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "establishment_members_userId_establishmentId_key" ON "establishment_members"("userId", "establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- AddForeignKey
ALTER TABLE "reporting_years" ADD CONSTRAINT "reporting_years_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_reportingYearId_fkey" FOREIGN KEY ("reportingYearId") REFERENCES "reporting_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_records" ADD CONSTRAINT "certification_records_reportingYearId_fkey" FOREIGN KEY ("reportingYearId") REFERENCES "reporting_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_records" ADD CONSTRAINT "certification_records_certifiedById_fkey" FOREIGN KEY ("certifiedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_members" ADD CONSTRAINT "establishment_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_members" ADD CONSTRAINT "establishment_members_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_members" ADD CONSTRAINT "establishment_members_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
