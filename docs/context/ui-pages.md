# UI Pages — Route Map

Auto-generated from `apps/web/src/app/`. Do not edit manually.

---

| Route | File | tRPC Queries Used | Notes |
|-------|------|-------------------|-------|
| `/admin` | `apps/web/src/app/(app)/admin/page.tsx` | — | exec-only |
| `/admin/users` | `apps/web/src/app/(app)/admin/users/page.tsx` | `users.list.useQuery`, `users.updateRole.useMutation`, `users.create.useMutation`, `users.resetPassword.useMutation` | exec-only |
| `/archive` | `apps/web/src/app/(app)/archive/page.tsx` | `export.csvITA300A.useQuery`, `reportingYears.retentionStatus.useQuery`, `establishments.list.useQuery` | pdf-download |
| `/cases/new` | `apps/web/src/app/(app)/cases/new/page.tsx` | `wizard.steps.useQuery`, `cases.create.useMutation` | privacy |
| `/cases` | `apps/web/src/app/(app)/cases/page.tsx` | `establishments.list.useQuery` |  |
| `/cases/[id]` | `apps/web/src/app/(app)/cases/[id]/page.tsx` | `cases.get.useQuery`, `reportingYears.get.useQuery`, `audit.forCase.useQuery`, `cases.update.useMutation` | privacy, pdf-download |
| `/dashboard` | `apps/web/src/app/(app)/dashboard/page.tsx` | — |  |
| `/establishments` | `apps/web/src/app/(app)/establishments/page.tsx` | `establishments.list.useQuery`, `establishments.create.useMutation` |  |
| `/establishments/[id]` | `apps/web/src/app/(app)/establishments/[id]/page.tsx` | `establishments.get.useQuery`, `reportingYears.create.useMutation`, `establishments.complianceStatus.useQuery` |  |
| `/establishments/[id]/years/[yearId]` | `apps/web/src/app/(app)/establishments/[id]/years/[yearId]/page.tsx` | `cases.list.useQuery`, `reportingYears.get.useQuery` | pdf-download |
| `/forms/300a/[yearId]` | `apps/web/src/app/(app)/forms/300a/[yearId]/page.tsx` | `forms.get300A.useQuery`, `reportingYears.updateStats.useMutation`, `reportingYears.certify300A.useMutation` | exec-only, pdf-download |
| `/forms` | `apps/web/src/app/(app)/forms/page.tsx` | `establishments.list.useQuery`, `reportingYears.list.useQuery` | pdf-download |
| `/invite/[token]` | `apps/web/src/app/invite/[token]/page.tsx` | `invitations.accept.useMutation` |  |
| `/login` | `apps/web/src/app/login/page.tsx` | `users.register.useMutation` |  |
| `/` | `apps/web/src/app/page.tsx` | — |  |
