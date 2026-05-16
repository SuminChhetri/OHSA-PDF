"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", RECORDKEEPER: "Recordkeeper", REVIEWER: "Reviewer",
  EXECUTIVE: "Executive", OWNER: "Owner", EDITOR: "Editor",
  SENSITIVE_REVIEWER: "Sensitive Reviewer", DOWNLOAD_REVIEWER: "Download Reviewer",
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-500/20 text-violet-300 ring-1 ring-inset ring-violet-500/25",
  OWNER: "bg-violet-500/20 text-violet-300 ring-1 ring-inset ring-violet-500/25",
  RECORDKEEPER: "bg-sky-500/20 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  EDITOR: "bg-sky-500/20 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  EXECUTIVE: "bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  REVIEWER: "bg-slate-500/20 text-slate-400 ring-1 ring-inset ring-slate-500/25",
  SENSITIVE_REVIEWER: "bg-orange-500/20 text-orange-300 ring-1 ring-inset ring-orange-500/25",
  DOWNLOAD_REVIEWER: "bg-slate-500/20 text-slate-400 ring-1 ring-inset ring-slate-500/25",
};

function IcoDashboard() {
  return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
}
function IcoBuilding() {
  return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
}
function IcoClipboard() {
  return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;
}
function IcoForms() {
  return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
}
function IcoArchive() {
  return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
}
function IcoSignOut() {
  return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;
}
function IcoMenu() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
}
function IcoClose() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

const BASE_LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: IcoDashboard },
  { href: "/establishments", label: "Establishments", Icon: IcoBuilding },
  { href: "/cases", label: "Cases", Icon: IcoClipboard },
  { href: "/forms", label: "Forms", Icon: IcoForms },
  { href: "/archive", label: "Archive", Icon: IcoArchive },
];

interface SidebarNavProps {
  role: string;
  name?: string | null;
  email?: string | null;
}

export function SidebarNav({ role, name, email }: SidebarNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : (email?.[0]?.toUpperCase() ?? "?");

  const sidebarBody = (
    <div className="flex flex-col h-full" style={{ background: "#0D1117" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ borderBottom: "1px solid rgb(255 255 255 / 0.06)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 2px 8px rgb(245 158 11 / 0.4)" }}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-white text-sm font-semibold tracking-tight">OSHA Records</p>
          <p className="text-[11px]" style={{ color: "rgb(148 163 184 / 0.5)" }}>29 CFR Part 1904</p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgb(148 163 184 / 0.35)" }}>
          Navigation
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {BASE_LINKS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <div key={href} className="relative">
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-amber-400" />
              )}
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "text-amber-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                style={active ? { background: "rgb(245 158 11 / 0.1)" } : undefined}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "rgb(255 255 255 / 0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "";
                }}
              >
                <span className={`transition-colors ${active ? "text-amber-400" : "text-slate-500"}`}>
                  <Icon />
                </span>
                {label}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="shrink-0 p-3 space-y-1" style={{ borderTop: "1px solid rgb(255 255 255 / 0.06)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgb(255 255 255 / 0.03)" }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", boxShadow: "0 0 0 2px rgb(59 130 246 / 0.2)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {name && <p className="text-slate-200 text-sm font-medium truncate leading-tight">{name}</p>}
            {email && <p className="text-slate-500 text-xs truncate">{email}</p>}
          </div>
        </div>
        <div className="px-3 pb-1">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_COLORS[role] ?? "bg-slate-500/20 text-slate-400 ring-1 ring-inset ring-slate-500/25"}`}>
            {ROLE_LABELS[role] ?? role}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-200 transition-colors duration-100"
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgb(255 255 255 / 0.05)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
        >
          <IcoSignOut />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-3.5 left-3.5 z-50 p-2 rounded-lg text-slate-400 hover:text-white shadow-lg transition-colors"
        style={{ background: "#0D1117" }}
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <IcoClose /> : <IcoMenu />}
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transition-transform duration-200 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarBody}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30" style={{ boxShadow: "1px 0 0 rgb(255 255 255 / 0.04)" }}>
        {sidebarBody}
      </aside>
    </>
  );
}
