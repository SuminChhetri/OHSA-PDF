Improve this OSHA reporting app requirement:

The system must protect sensitive OSHA and company information so that no one on the software/vendor side can view or access the raw sensitive data, including backend operators, developers, support staff, or database administrators.

Sensitive data should be protected using privacy-by-design controls such as encryption, strict role-based access, audit logs, and, where possible, field-level encryption or customer-managed encryption keys.

The backend may process sensitive OSHA-related data only for required system functions, such as generating reports, applying redactions, and validating filings. However, the sensitive data must not be visible in plain text to unauthorized users or software-side personnel.

The app must generate two report versions:
1. Redacted Version: hides sensitive employee, medical, injury, privacy-case, and company-confidential information.
2. Unredacted Version: includes full data and is available only to authorized customer-side users.

After completing a filing, the filer must be able to download either the redacted or unredacted version, based on their permissions.

The filer can invite other users by email and assign access levels:
- Owner/Filer: edit, submit, view sensitive data, download both versions.
- Editor: edit and continue the filing.
- Sensitive Data Reviewer: view sensitive data and download unredacted version.
- Normal Reviewer: view redacted version only.
- Download-Only Reviewer: download only permitted version.

All access to sensitive data, unredacted views, downloads, permission changes, and backend processing events must be logged for audit/compliance.

Rewrite this as a clear product/security requirement with workflow, roles, permissions, privacy controls, and acceptance criteria.