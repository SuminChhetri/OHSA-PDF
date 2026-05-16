import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const links = [
    { href: "/establishments",  label: "Establishments",        desc: "Manage locations, NAICS codes, and reporting years" },
    { href: "/cases",           label: "All Cases",             desc: "Browse and search all recorded incidents" },
    { href: "/forms",           label: "Forms",                 desc: "View 300, 300A, and 301 PDFs across all years" },
    { href: "/archive",         label: "Archive",               desc: "Retention status and 5-year retention enforcement" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Administration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as <span className="font-medium">{session.user.email}</span> · Role: Admin
        </p>
      </div>

      <div className="card divide-y divide-slate-100">
        {links.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Role Reference</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { role: "ADMIN",        desc: "Full access — manage users, reopen forms, view all audit logs" },
            { role: "EXECUTIVE",    desc: "Certify 300A, finalize forms, view audit trail" },
            { role: "REVIEWER",     desc: "Approve, request changes, view audit trail" },
            { role: "RECORDKEEPER", desc: "Create and edit cases, submit forms for review" },
          ].map(({ role, desc }) => (
            <div key={role} className="rounded-lg border border-slate-200 p-3">
              <p className="font-semibold text-slate-800">{role}</p>
              <p className="text-slate-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
