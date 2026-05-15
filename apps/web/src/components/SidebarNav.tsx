"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/establishments", label: "Establishments" },
  { href: "/archive", label: "Archive" },
];

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    ...navLinks,
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-base font-bold text-gray-900">OSHA Records</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        <div className="w-5 h-0.5 bg-current mb-1"></div>
        <div className="w-5 h-0.5 bg-current mb-1"></div>
        <div className="w-5 h-0.5 bg-current"></div>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-60 bg-white shadow-xl transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:top-0 lg:left-0 lg:h-full lg:w-60 bg-white border-r border-gray-200 shadow-sm">
        {navContent}
      </aside>
    </>
  );
}
