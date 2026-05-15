"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const emptyForm = {
  name: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  naicsCode: "",
  sicCode: "",
};

export default function EstablishmentsPage() {
  const { data, isLoading, error, refetch } = trpc.establishments.list.useQuery();
  const createMutation = trpc.establishments.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      name: form.name,
      street: form.street,
      city: form.city,
      state: form.state,
      zip: form.zip,
      naicsCode: form.naicsCode,
      sicCode: form.sicCode || undefined,
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Establishments</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? "Cancel" : "New Establishment"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Establishment</h2>
          {createMutation.error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {createMutation.error.message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Establishment Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Acme Manufacturing"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="123 Industrial Blvd"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                name="zip"
                value={form.zip}
                onChange={handleChange}
                required
                pattern="\d{5}(-\d{4})?"
                className="form-input"
                placeholder="12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NAICS Code <span className="text-red-500">*</span>
              </label>
              <input
                name="naicsCode"
                value={form.naicsCode}
                onChange={handleChange}
                required
                minLength={4}
                maxLength={6}
                className="form-input"
                placeholder="332110"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SIC Code
              </label>
              <input
                name="sicCode"
                value={form.sicCode}
                onChange={handleChange}
                className="form-input"
                placeholder="3462"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? "Saving…" : "Create Establishment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {data && data.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No establishments yet.</p>
          <p className="mt-1 text-sm">Click "New Establishment" to get started.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAICS</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reporting Years</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((est) => (
                  <tr key={est.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{est.name}</td>
                    <td className="px-4 py-3 text-gray-600">{est.state}</td>
                    <td className="px-4 py-3 text-gray-600">{est.naicsCode}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {est._count.reportingYears}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/establishments/${est.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
