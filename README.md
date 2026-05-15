# OSHA Recordkeeping System

A production-grade OSHA injury and illness recordkeeping web application implementing the full requirements of **29 CFR Part 1904**. Self-hostable, role-separated, and built for compliance auditors.

---

## What It Does

Handles the complete OSHA recordkeeping triad end-to-end for one or more establishments across multiple reporting years:

| Form | Purpose |
|------|---------|
| **OSHA Form 301** | Injury and Illness Incident Report — one per case, full regulatory field set |
| **OSHA Form 300** | Log of Work-Related Injuries and Illnesses — auto-populated from 301s |
| **OSHA Form 300A** | Annual Summary — rolled up from 300 Log, with certification and posting |

Plus:

- **Recordability decision wizard** — walks users through 1904.4–1904.7 analysis before committing a case
- **Metrics dashboard** — TRIR, DART, severity rate, trailing-12-month trends, multi-year comparison
- **ITA readiness check** — tells users exactly which forms to submit electronically and by when (1904.41)
- **Privacy case enforcement** — 6 privacy reasons per 1904.29(b)(7), name masking on 300 Log, separate confidential roster
- **Severe injury alerts** — 1904.39 banners for fatalities (8 hr) and hospitalizations/amputations/eye loss (24 hr)
- **5-year retention guard** — prevents deletion of reporting years within the retention window (1904.33)
- **Server-side PDF generation** — faithful reproductions of all three official OSHA forms
- **CSV export** — 300A data in ITA-accepted format with 1904.41(c) field exclusions applied
- **JSON backup/restore** — full establishment-year export importable into another instance
- **Append-only audit log** — every create/update/delete recorded with user, timestamp, and reason

---

## Regulatory Scope

| Regulation | Implemented |
|-----------|-------------|
| 29 CFR 1904.1 — ≤10 employee partial exemption | ✓ |
| 29 CFR 1904.2 — Low-hazard NAICS (Appendix A to Subpart B, 82 codes) | ✓ |
| 29 CFR 1904.4–1904.7 — Recording criteria | ✓ |
| 29 CFR 1904.7(b)(3) — Day-counting (calendar days, 180-day cap, mutual exclusivity) | ✓ |
| 29 CFR 1904.7(b)(5)(ii) — 14-item first-aid exclusion list | ✓ |
| 29 CFR 1904.29(b)(7)–(9) — Privacy case rules (6 reasons) | ✓ |
| 29 CFR 1904.32 — Annual summary, posting window, executive certification | ✓ |
| 29 CFR 1904.33 — 5-year retention, update obligations | ✓ |
| 29 CFR 1904.39 — Severe injury reporting deadlines | ✓ |
| 29 CFR 1904.41 — ITA electronic submission tiers and deadlines | ✓ |
| Appendix A to Subpart B — Partially exempt NAICS (82 codes) | ✓ |
| Appendix B to Subpart E — ITA Tier 3 NAICS (107 codes) | ✓ |

> **Disclaimer:** This tool assists compliance but does not constitute legal advice. See [docs/disclaimer.md](docs/disclaimer.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| API | tRPC v10 (type-safe RPC) |
| ORM | Prisma |
| Database | PostgreSQL (via Prisma) |
| Auth | NextAuth v4 — Credentials provider with JWT |
| PDF | @react-pdf/renderer (server-side, no headless browser) |
| Tests | Vitest (135 unit tests on regulatory logic) |
| Types | TypeScript strict mode throughout |

---

## Project Structure

```
OHSA/
├── packages/
│   ├── regulatory-logic/     # Pure 29 CFR 1904 rule functions + 135 unit tests
│   └── db/                   # Prisma schema, migrations, seed data
└── apps/
    └── web/                  # Next.js full-stack app
        ├── src/server/       # tRPC routers + auth
        ├── src/app/          # Next.js pages + PDF API routes
        ├── src/components/   # UI components
        └── src/lib/pdf/      # React-PDF document templates
```

---

## Installation & Running

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### 1. Install dependencies

```bash
cd OHSA
npm install --legacy-peer-deps
```

### 2. Initialize the database

```bash
cd packages/db
npx prisma migrate dev --name init
npx ts-node --esm prisma/seed.ts
cd ../..
```

### 3. Start the development server

```bash
npm run dev -w @osha/web
```

The app will be available at **http://localhost:3000**.

---

## Demo Credentials

| Role | Email | Password | Can Do |
|------|-------|----------|--------|
| Admin | admin@acme-industrial.example | admin1234 | Everything + privacy roster |
| Recordkeeper | safety@acme-industrial.example | safety1234 | Create/edit cases |
| Executive | vp.ops@acme-industrial.example | vp1234 | Certify 300A |

---

## Seed Data

The seed creates **Acme Industrial Supply Co.** (NAICS 3329, Springfield IL) with a 2025 reporting year containing five sample cases:

| Case | Classification | Notes |
|------|---------------|-------|
| 2025-001 | G — Death | Fatal forklift incident |
| 2025-002 | H — Days Away (14 days) | Laceration |
| 2025-003 | I — Restricted Work (5 days) | Sprain |
| 2025-004 | J — Other Recordable | Chemical splash |
| 2025-005 | J — Other Recordable, Privacy | Needlestick — 1904.29(b)(7)(v) |

---

## Running Tests

```bash
npm run test -w @osha/regulatory-logic
```

135 unit tests covering: recordability, day counting, privacy, exemption, ITA eligibility, severe reporting, classification, work-relatedness, and the decision wizard.

---

## PDF Generation

Three server-side PDF endpoints are available after authentication:

| Endpoint | Form | Size |
|----------|------|------|
| `GET /api/pdf/300/[yearId]` | Form 300 — Log | Legal landscape (14×8.5 in) |
| `GET /api/pdf/300a/[yearId]` | Form 300A — Summary | Letter landscape (11×8.5 in) |
| `GET /api/pdf/301/[caseId]` | Form 301 — Incident Report | Letter portrait (8.5×11 in) |

Download buttons are wired into the 300 Log page, 300A page, and case detail page.

---

## Production Deployment

See [Docker Compose setup](docker-compose.yml) for PostgreSQL-backed production deployment. Set these environment variables:

```env
DATABASE_URL=postgresql://user:password@db:5432/osha
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://your-domain.com
```

---

## Screenshots

> _Screenshots coming soon. Run the app locally and navigate to http://localhost:3000 to see the dashboard, 300 Log, and 300A form._

---

## License

MIT — see [LICENSE](LICENSE)
