"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function CasesPage() {
  const { data, isLoading, error } = trpc.establishments.list.useQuery();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select an establishment and reporting year to view or add cases.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="card p-16 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <p className="text-slate-800 font-semibold">No establishments yet</p>
          <p className="mt-1 text-sm text-slate-500">
            <Link href="/establishments" className="text-blue-600 hover:underline">Add an establishment</Link> first to start recording cases.
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Establishment</th>
                <th>City, State</th>
                <th>NAICS</th>
                <th className="text-right">Reporting Years</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((est) => (
                <tr key={est.id}>
                  <td className="font-medium text-slate-900">{est.name}</td>
                  <td className="text-slate-600">{est.city}, {est.state}</td>
                  <td><span className="font-mono text-blue-600 text-sm">{est.naicsCode}</span></td>
                  <td className="text-right text-slate-600">{est._count.reportingYears}</td>
                  <td className="text-right">
                    <Link
                      href={`/establishments/${est.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                    >
                      View Years &amp; Cases →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        <span className="font-semibold">How to add a case:</span> Go to an establishment → select a reporting year → click &ldquo;Add New Case&rdquo; to open the recordability wizard and Form 301.
      </div>
    </div>
  );
}
