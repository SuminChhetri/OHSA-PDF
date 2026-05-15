# Changelog

All notable changes to the OSHA Recordkeeping System are documented in this file.

---

## [0.1.0] — 2026-05-14

Initial release. Complete implementation of all nine phases specified in the project work order.

### Added

**Regulatory Logic (`packages/regulatory-logic`)**
- `evaluateRecordability()` — 3-part test: work-related → new case → general criteria (29 CFR 1904.4–1904.7)
- `determineWorkRelatedness()` — work environment check + all 9 exceptions in 1904.5(b)(2)
- `evaluateMedicalTreatment()` — full 14-item first-aid exclusion list per 1904.7(b)(5)(ii)(A)–(N)
- `countDays()` — day-after rule, calendar days, 180-day cap, mutual exclusivity per 1904.7(b)(3)
- `evaluatePrivacyCase()` — all 6 privacy reasons per 1904.29(b)(7)–(9)
- `sanitizePrivacyCaseDescription()` — generic description substitution for privacy cases
- `checkExemption()` — ≤10 employees (1904.1) and low-hazard NAICS Appendix A (1904.2)
- `checkITAEligibility()` — three-tier ITA eligibility with Appendix B check first (1904.41)
- `computeITADeadline()` — March 2 annual submission deadline
- `checkSevereReporting()` — fatality (8 hr), hospitalization/amputation/eye loss (24 hr), MVA exceptions (1904.39)
- `computeReportingDeadline()` — exact deadline timestamps for severe injury reporting
- `classifyOutcome()` — most-serious-outcome rule G > H > I > J
- `validateCaseTypeExclusivity()` — injury/illness mutual exclusivity for M columns
- `createWizard()` / `advanceWizard()` — immutable 12-step recordability wizard
- NAICS datasets: 82 Appendix A Subpart B exempt codes; 107 Appendix B Subpart E 300/301 codes
- 135 unit tests (Vitest) covering all modules

**Data Layer (`packages/db`)**
- Prisma schema with 7 models: `User`, `Establishment`, `ReportingYear`, `Case`, `CertificationRecord`, `AuditLog`, `NaicsCode`
- SQLite migration with all 29 CFR Part 1904 fields
- Seed data: 189 NAICS codes, 3 demo users, 1 establishment, 2025 reporting year with 5 sample cases (Death / Days Away / Restricted / Other Recordable / Privacy Needlestick)

**API Layer (`apps/web/src/server`)**
- tRPC v10 app router with 10 sub-routers: `cases`, `establishments`, `reportingYears`, `forms`, `metrics`, `export`, `itaCheck`, `audit`, `wizard`, `users`
- 5 procedure tiers: `publicProcedure`, `protectedProcedure`, `adminProcedure`, `recordkeeperProcedure`, `executiveProcedure`
- NextAuth v4 Credentials provider with bcrypt; JWT with role
- Privacy masking at API layer (`applyPrivacyMask`) and forms layer (`get300Log`)
- Append-only audit log with `VIEW_PRIVACY`, `CREATE`, `UPDATE`, `DELETE`, `EXPORT` actions
- `certify300A` — executive-only 300A certification per 1904.32(b)(3)
- `retentionStatus` — 5-year retention window guard per 1904.33
- `checkITAEligibility` — ITA tier + deadline + field exclusions
- `csvITA300A`, `csvITA300And301` — ITA CSV exports with 1904.41(c) field exclusions
- `jsonBackup` / `jsonRestore` — full establishment-year JSON backup/restore
- TRIR, DART, severity rate metrics; monthly trend; multi-year comparison

**UI (`apps/web/src/app`)**
- Login page with credentials sign-in
- Protected app layout with mobile hamburger + desktop sidebar navigation
- Dashboard: TRIR/DART/severity metric cards, monthly trend chart, multi-year comparison
- Establishments list + inline create
- Establishment detail with compliance status and reporting years
- 300 Log view with full OSHA column layout (A–J, K, L, M1–M6), privacy yellow highlight, fatality red highlight
- New case entry: two-step recordability wizard then full Form 301 entry
- Severe injury banner (1904.39) shown on case entry when applicable
- Case detail/edit page with update reason field + audit history
- Form 300A annual summary with certification flow, posting reminder, ITA card
- Archive page with retention status, JSON backup, CSV downloads
- Print-faithful HTML form replicas for Forms 300, 300A, 301 (browser print fallback)

**PDF Generation**
- Server-side PDF via `@react-pdf/renderer` (no headless browser)
- Form 300 PDF: legal landscape (14×8.5 in), full 18-column log table with totals
- Form 300A PDF: letter landscape (11×8.5 in), all summary sections + certification + posting notice
- Form 301 PDF: letter portrait (8.5×11 in), all 4 sections + privacy/severe banners
- Authenticated API routes: `GET /api/pdf/300/[yearId]`, `GET /api/pdf/300a/[yearId]`, `GET /api/pdf/301/[caseId]`
- Download buttons wired into 300 Log, 300A, and case detail pages

**Documentation**
- `README.md` — install/run instructions, demo credentials, seed data, feature overview
- `COMPLIANCE.md` — complete mapping of every 29 CFR Part 1904 rule to implementing file/function
- `ARCHITECTURE.md` — Mermaid data-flow and ER diagrams, layered design rationale, security model
- `docs/recordability-wizard.md` — 12-step Mermaid flowchart + prose for each step with CFR citations
- `docs/disclaimer.md` — legal disclaimer, ITA submission instructions, State Plan note
- `CHANGELOG.md` — this file
- `LICENSE` — MIT

**Deployment**
- `docker-compose.yml` — PostgreSQL + web app container setup
- `Dockerfile` — multi-stage Next.js production build
- Environment variable documentation for `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
