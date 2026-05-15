"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { NaicsCombobox } from "@/components/NaicsCombobox";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const emptyForm = { name: "", street: "", city: "", state: "", zip: "", naicsCode: "", sicCode: "" };

export default function EstablishmentsPage() {
  const { data, isLoading, error, refetch } = trpc.establishments.list.useQuery();
  const createMutation = trpc.establishments.create.useMutation({
    onSuccess: () => { setShowForm(false); setForm(emptyForm); refetch(); },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ ...form, sicCode: form.sicCode || undefined });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="page-title">Establishments</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Cancel" : "+ New Establishment"}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">New Establishment</h2>
          {createMutation.error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {createMutation.error.message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Establishment Name <span className="text-red-500">*</span>
              </label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="form-input" placeholder="Acme Manufacturing" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input name="street" value={form.street} onChange={handleChange} required
                className="form-input" placeholder="123 Industrial Blvd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input name="city" value={form.city} onChange={handleChange} required className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <select name="state" value={form.state} onChange={handleChange} required className="form-input">
                <option value="">Select state</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input name="zip" value={form.zip} onChange={handleChange} required
                pattern="\d{5}(-\d{4})?" className="form-input" placeholder="12345" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                SIC Code <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input name="sicCode" value={form.sicCode} onChange={handleChange}
                className="form-input" placeholder="3462" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                NAICS Code <span className="text-red-500">*</span>
                <span className="ml-1 text-slate-400 font-normal">— type a code or keyword to search</span>
              </label>
              <NaicsCombobox
                value={form.naicsCode}
                onChange={(code) => setForm((prev) => ({ ...prev, naicsCode: code }))}
                required
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="btn-secondary">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? "Saving…" : "Create Establishment"}
              </button>
            </div>
          </form>
        </div>
      )}

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

      {data && data.length === 0 && !showForm && (
        <div className="card p-16 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <p className="text-slate-800 font-semibold">No establishments yet</p>
          <p className="mt-1 text-sm text-slate-500">Click &quot;+ New Establishment&quot; to add your first location.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
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
                  <td>{est.city}, {est.state}</td>
                  <td><span className="font-mono text-blue-600">{est.naicsCode}</span></td>
                  <td className="text-right">{est._count.reportingYears}</td>
                  <td className="text-right">
                    <Link href={`/establishments/${est.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
