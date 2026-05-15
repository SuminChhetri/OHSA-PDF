# OSHA Recordkeeping System — Claude Code Context

This file is read automatically by Claude Code on every session. It gives you the full codebase map so you don't need to scan individual files.

---

## Codebase Layout

```
OHSA/
├── packages/regulatory-logic/src/   ← pure 29 CFR 1904 rule functions, 135 tests
├── packages/db/prisma/              ← Prisma schema + seed (7 models)
├── apps/web/src/
│   ├── server/routers/              ← tRPC v10 routers (10 sub-routers)
│   ├── server/auth.ts               ← NextAuth v4 credentials provider
│   ├── server/context.ts            ← createInnerTRPCContext (App Router)
│   ├── server/trpc.ts               ← 5 procedure tiers
│   ├── lib/pdf/                     ← @react-pdf/renderer templates
│   └── app/                         ← Next.js 14 App Router pages + API routes
├── docs/context/                    ← Auto-generated module summaries (read these)
│   ├── regulatory-logic.md          ← every exported function + what it does
│   ├── api-routers.md               ← every tRPC procedure
│   ├── schema.md                    ← DB models + key fields
│   └── ui-pages.md                  ← every page route + its data dependencies
├── COMPLIANCE.md                    ← every CFR rule → file/function mapping
└── ARCHITECTURE.md                  ← Mermaid diagrams, design decisions
```

## How to Navigate This Codebase

**Before reading any file**, check `docs/context/` — the summaries tell you exactly which file and line handles the thing you're looking for. Only open the actual source file once you know which one it is.

**Regulatory logic questions** → `docs/context/regulatory-logic.md`  
**API / data questions** → `docs/context/api-routers.md`  
**Database schema questions** → `docs/context/schema.md`  
**UI / page questions** → `docs/context/ui-pages.md`  
**CFR compliance mapping** → `COMPLIANCE.md`  
**Architecture decisions** → `ARCHITECTURE.md`

---

## Key Conventions

| Convention | Rule |
|-----------|------|
| Privacy masking | Applied in `cases.ts:applyPrivacyMask()` AND `forms.ts:get300Log` — two independent layers |
| Soft delete | `cases.delete` sets `isRecordable=false`; never destroys rows (1904.33) |
| Audit log | Append-only — no DELETE/UPDATE procedures exist on `AuditLog` in any router |
| Role check | Use the correct procedure tier: `adminProcedure`, `recordkeeperProcedure`, `executiveProcedure` |
| Day counting | Day-after rule + calendar days + 180-day cap — all in `day-counter.ts:countDays()` |
| ITA tiers | Tier 3 (Appendix B) checked BEFORE Tier 1 (250+ any industry) |
| PDF routes | Authenticated via `getServerSession`; use `appRouter.createCaller(ctx)` to fetch data |

---

## Role Values (stored as String in DB)

`ADMIN` · `RECORDKEEPER` · `REVIEWER` · `EXECUTIVE`

---

## Environment Variables

```
DATABASE_URL        postgresql://USER:PASS@HOST:5432/DB?sslmode=require
NEXTAUTH_SECRET     random 32-char string
NEXTAUTH_URL        http://localhost:3000
```

---

## Running Things

```bash
npm install --legacy-peer-deps          # install all workspaces
npm run dev -w @osha/web                # start dev server → localhost:3000
npm run test -w @osha/regulatory-logic  # run 135 regulatory unit tests
npm run typecheck -w @osha/web          # TypeScript check
node scripts/gen-context.mjs            # regenerate docs/context/ files
```

---

## Demo Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@acme-industrial.example | admin1234 |
| Recordkeeper | safety@acme-industrial.example | safety1234 |
| Executive | vp.ops@acme-industrial.example | vp1234 |
