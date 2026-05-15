# Database Schema

Auto-generated from `packages/db/prisma/schema.prisma`. Do not edit manually.

---

## `User`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | @id @default(cuid()) |
| `email` | `String` | @unique |
| `name` | `String` |  |
| `role` | `String` | @default("RECORDKEEPER") |
| `passwordHash` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `certifications` | `CertificationRecord[]` |  |
| `auditLogs` | `AuditLog[]` |  |

## `Establishment`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | @id @default(cuid()) |
| `name` | `String` |  |
| `street` | `String` |  |
| `city` | `String` |  |
| `state` | `String` | // Two-letter abbreviation |
| `zip` | `String` |  |
| `naicsCode` | `String` |  |
| `sicCode` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `reportingYears` | `ReportingYear[]` |  |

## `ReportingYear`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | @id @default(cuid()) |
| `establishmentId` | `String` |  |
| `year` | `Int` | // Calendar year, e.g. 2024 |
| `avgEmployees` | `Int?` |  |
| `totalHoursWorked` | `Int?` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `establishment` | `Establishment` | @relation(fields: [establishmentId], references: [id]) |
| `cases` | `Case[]` |  |
| `certifications` | `CertificationRecord[]` |  |

## `Case`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | @id @default(cuid()) |
| `caseNumber` | `String` |  |
| `reportingYearId` | `String` |  |
| `employeeName` | `String` |  |
| `employeeJobTitle` | `String` |  |
| `employeeDOB` | `DateTime?` |  |
| `employeeHireDate` | `DateTime?` |  |
| `employeeStreet` | `String?` |  |
| `employeeCity` | `String?` |  |
| `employeeState` | `String?` |  |
| `employeeZip` | `String?` |  |
| `dateOfInjury` | `DateTime` |  |
| `timeOfInjury` | `String?` | // "HH:MM" or "Unknown" |
| `whereEventOccurred` | `String` | // 301 field 7 |
| `whatEmployeeWasDoing` | `String` | // 301 field 8 |
| `whatHappened` | `String` | // 301 field 9 |
| `bodyPartAffected` | `String` | // 301 field 10 |
| `objectOrSubstance` | `String` | // 301 field 11 |
| `treatedInEmergencyRoom` | `Boolean` | @default(false) |
| `hospitalizedOvernight` | `Boolean` | @default(false) |
| `physicianName` | `String?` |  |
| `facilityName` | `String?` |  |
| `facilityStreet` | `String?` |  |
| `facilityCity` | `String?` |  |
| `facilityState` | `String?` |  |
| `facilityZip` | `String?` |  |
| `isPrivacyCase` | `Boolean` | @default(false) |
| `privacyReason` | `String?` |  |
| `outcome` | `String` |  |
| `daysAway` | `Int` | @default(0) // Column K |
| `daysRestricted` | `Int` | @default(0) // Column L |
| `caseType` | `String` |  |
| `isRecordable` | `Boolean` | @default(true) |
| `wizardAnswers` | `String?` | // JSON blob |
| `severityLevel` | `String?` |  |
| `severeReportedAt` | `DateTime?` |  |
| `severeReportMethod` | `String?` | // "PHONE" | "ONLINE" | "IN_PERSON" |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `createdById` | `String` |  |
| `updatedById` | `String` |  |
| `reportingYear` | `ReportingYear` | @relation(fields: [reportingYearId], references: [id]) |
| `auditLogs` | `AuditLog[]` |  |

## `CertificationRecord`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | @id @default(cuid()) |
| `reportingYearId` | `String` |  |
| `certifiedById` | `String` |  |
| `certifiedAt` | `DateTime` | @default(now()) |
| `signerName` | `String` | // Name as it appears on the certification |
| `signerTitle` | `String` | // Title of the certifying executive |
| `reportingYear` | `ReportingYear` | @relation(fields: [reportingYearId], references: [id]) |
| `certifiedBy` | `User` | @relation(fields: [certifiedById], references: [id]) |

## `AuditLog`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | @id @default(cuid()) |
| `userId` | `String` |  |
| `action` | `String` |  |
| `entityType` | `String` | // "Case" | "ReportingYear" | "Establishment" | ... |
| `entityId` | `String` |  |
| `before` | `String?` | // JSON |
| `after` | `String?` | // JSON |
| `reason` | `String?` | // Reason for the change (required for updates to recorded cases) |
| `ipAddress` | `String?` |  |
| `timestamp` | `DateTime` | @default(now()) |
| `caseId` | `String?` |  |
| `case` | `Case?` | @relation(fields: [caseId], references: [id]) |
| `user` | `User` | @relation(fields: [userId], references: [id]) |

## `NaicsCode`

| Field | Type | Notes |
|-------|------|-------|
| `code` | `String` | @id // 4-digit NAICS code (stored as string for prefix matching) |
| `title` | `String` |  |
| `isAppendixASubpartB` | `Boolean` | @default(false) |
| `isAppendixBSubpartE` | `Boolean` | @default(false) |

