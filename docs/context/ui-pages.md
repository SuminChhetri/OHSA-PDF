# UI Pages — Route Map

Auto-generated from `apps/web/src/app/`. Do not edit manually.

---

| Route | File | tRPC Queries Used | Notes |
|-------|------|-------------------|-------|
| `/admin` | `apps/web/src/app/(app)/admin/page.tsx` | — |  |
| `/archive` | `apps/web/src/app/(app)/archive/page.tsx` | `export.jsonBackup.useQuery`, `export.csvITA300A.useQuery`, `reportingYears.retentionStatus.useQuery`, `establishments.list.useQuery` |  |
| `/cases/new` | `apps/web/src/app/(app)/cases/new/page.tsx` | `wizard.steps.useQuery`, `cases.create.useMutation` | privacy |
| `/cases/[id]` | `apps/web/src/app/(app)/cases/[id]/page.tsx` | `cases.get.useQuery`, `audit.forCase.useQuery`, `cases.update.useMutation` | privacy, pdf-download |
| `/dashboard` | `apps/web/src/app/(app)/dashboard/page.tsx` | — |  |
| `/establishments` | `apps/web/src/app/(app)/establishments/page.tsx` | `establishments.list.useQuery`, `establishments.create.useMutation` |  |
| `/establishments/[id]` | `apps/web/src/app/(app)/establishments/[id]/page.tsx` | `establishments.get.useQuery`, `reportingYears.create.useMutation`, `establishments.complianceStatus.useQuery` |  |
| `/establishments/[id]/years/[yearId]` | `apps/web/src/app/(app)/establishments/[id]/years/[yearId]/page.tsx` | `cases.list.useQuery`, `reportingYears.get.useQuery` | pdf-download |
| `/forms/300a/[yearId]` | `apps/web/src/app/(app)/forms/300a/[yearId]/page.tsx` | `forms.get300A.useQuery`, `reportingYears.get.useQuery`, `itaCheck.getEligibility.useQuery`, `reportingYears.certify300A.useMutation` | exec-only, printable, pdf-download |
| `/invite/[token]` | `apps/web/src/app/invite/[token]/page.tsx` | `invitations.accept.useMutation` |  |
| `/login` | `apps/web/src/app/login/page.tsx` | — |  |
