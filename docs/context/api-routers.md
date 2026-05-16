# tRPC API Routers — Procedure Map

Auto-generated from `apps/web/src/server/routers/`. Do not edit manually.

**Procedure tiers:** `publicProcedure` · `protectedProcedure` · `adminProcedure` · `recordkeeperProcedure` · `executiveProcedure`

---

## `audit` (`apps/web/src/server/routers/audit.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `list` | `protected` | query | List audit log entries. Admin and Reviewer only. |
| `forCase` | `protected` | query | Get full audit history for a specific case. |

## `cases` (`apps/web/src/server/routers/cases.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `list` | `protected` | query | List all cases for a reporting year (300 Log view). |
| `get` | `protected` | query | Get a single case (Form 301 view). Logs VIEW_PRIVACY for admin access to privacy cases. |
| `getPrivacyRoster` | `protected` | query | Get the confidential privacy case roster for a reporting year. Per 1904.29(b)(6): maintain a separate list of case numbers and employee names for privacy cases, available to government representatives upon request. Admin-only access. / |
| `create` | `recordkeeper` | mutation | Create a new case (Form 301 entry). Auto-assigns case number. |
| `update` | `recordkeeper` | query | Update a case. Records before/after snapshot in audit log. |
| `delete` | `recordkeeper` | mutation | Soft-delete a case (marks isRecordable = false and logs deletion). Hard deletion is NOT performed — the audit log must be retained per 1904.33. / |

## `establishments` (`apps/web/src/server/routers/establishments.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `naicsSearch` | `protected` | query | Search NAICS codes by code prefix or title keyword. |
| `list` | `protected` | query | List all establishments accessible to the current user. |
| `get` | `protected` | query | Get a single establishment with its reporting years. |
| `create` | `protected` | mutation | Create a new establishment. Any authenticated user may create one. |
| `update` | `recordkeeper` | mutation | Update an establishment's details. |
| `complianceStatus` | `protected` | query | Returns the recordkeeping exemption status and ITA eligibility for an establishment in a given reporting year. / |

## `export` (`apps/web/src/server/routers/export.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `csvITA300A` | `protected` | query | Export 300A data as CSV in the OSHA ITA bulk upload format. Field exclusions per 1904.41(c) are applied automatically. / |

## `forms` (`apps/web/src/server/routers/forms.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `get300Log` | `protected` | query | Assemble OSHA Form 300 (Log of Work-Related Injuries and Illnesses) data for a reporting year. Privacy: employee names are replaced with "privacy case" for all privacy cases regardless of user role — the 300 Log is the public-facing form. / |
| `get300A` | `protected` | query | Assemble OSHA Form 300A (Annual Summary) data. Totals are derived automatically from the 300 Log. Must be certified by a company executive per 1904.32(b)(3). Must be posted February 1 – April 30. 1904.32(b)(6). / |

## `invitations` (`apps/web/src/server/routers/invitations.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `accept` | `protected` | mutation | Accept an invitation by token. Creates user if needed, adds EstablishmentMember. |

## `metrics` (`apps/web/src/server/routers/metrics.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `dashboard` | `protected` | query | Dashboard summary metrics for a single reporting year. Returns TRIR, DART, severity rate, and case counts by outcome. / |
| `trend` | `protected` | query | Trailing 12-month trend — returns monthly case counts for the last 12 months ending in the month of the latest case in the given reporting year. / |
| `multiYear` | `protected` | query | Multi-year comparison for an establishment — returns TRIR and DART for each available reporting year (useful for trend analysis). / |

## `reportingYears` (`apps/web/src/server/routers/reportingYears.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `list` | `protected` | query | List reporting years for an establishment (newest first). |
| `get` | `protected` | query | Get a single reporting year with full stats needed for 300A. |
| `create` | `recordkeeper` | query | Create a reporting year for an establishment. |
| `updateStats` | `recordkeeper` | query | Update employment stats (needed for TRIR/DART calculation). |
| `certify300A` | `executive` | query | Certify the 300A annual summary. Per 1904.32(b)(3), only a company executive, owner, officer, or highest-ranking company official may certify. Enforced by executiveProcedure middleware (EXECUTIVE or ADMIN role). / |
| `retentionStatus` | `protected` | query | Enforce 5-year retention: returns reporting years that are safe to archive (older than 5 years) vs. years that must be retained per 1904.33. / |
| `delete` | `recordkeeper` | mutation | Permanently delete a reporting year. Only allowed if outside retention window. |

## `users` (`apps/web/src/server/routers/users.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `register` | `public` | query | Public registration — creates a standard REVIEWER account. Admin role is assigned by the software admin team only. |
| `list` | `admin` | query | List all users. Admin only. |
| `me` | `protected` | query | Get the currently authenticated user. |
| `create` | `admin` | query | Create a new user. Admin only. |
| `updateRole` | `admin` | mutation | Update a user's role. Admin only. |
| `resetPassword` | `admin` | mutation | Reset a user's password. Admin only. |

## `wizard` (`apps/web/src/server/routers/wizard.ts`)

| Procedure | Tier | Kind | Description |
|-----------|------|------|-------------|
| `evaluate` | `protected` | query | Evaluate recordability for a complete set of wizard answers. Returns the full decision path and final determination. / |
| `steps` | `protected` | query | Return the list of wizard step definitions (questions + CFR citations). |
| `firstAidList` | `protected` | query | Return all first-aid treatments (for the UI checklist). |
| `exceptions` | `protected` | query | Return all work-relatedness exceptions. |

