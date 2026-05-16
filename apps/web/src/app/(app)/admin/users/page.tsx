"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

const VALID_ROLES = ["ADMIN", "RECORDKEEPER", "REVIEWER", "EXECUTIVE"] as const;
type Role = (typeof VALID_ROLES)[number];

const ROLE_COLOR: Record<Role, string> = {
  ADMIN:        "bg-red-100 text-red-800",
  EXECUTIVE:    "bg-purple-100 text-purple-800",
  REVIEWER:     "bg-blue-100 text-blue-800",
  RECORDKEEPER: "bg-green-100 text-green-800",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLOR[role as Role] ?? "bg-slate-100 text-slate-700";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{role}</span>;
}

export default function AdminUsersPage() {
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("REVIEWER");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "REVIEWER" as Role, password: "" });
  const [createError, setCreateError] = useState("");

  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { setEditingId(null); refetch(); },
  });

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      setCreateForm({ name: "", email: "", role: "REVIEWER", password: "" });
      setCreateError("");
      refetch();
    },
    onError: (e) => setCreateError(e.message),
  });

  const resetPassword = trpc.users.resetPassword.useMutation({
    onSuccess: () => { setResetId(null); setNewPassword(""); setResetError(""); },
    onError: (e) => setResetError(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage accounts and role assignments.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + New User
        </button>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="card p-6 space-y-4 border-blue-200 bg-blue-50">
          <h2 className="text-sm font-semibold text-slate-800">Create New User</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                className="form-input"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                className="form-input"
                placeholder="jane@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as Role }))}
                className="form-input"
              >
                {VALID_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Temporary Password</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                className="form-input"
                placeholder="Min 8 characters"
              />
            </div>
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => createUser.mutate(createForm)}
              disabled={createUser.isPending || !createForm.name || !createForm.email || !createForm.password}
              className="btn-primary"
            >
              {createUser.isPending ? "Creating…" : "Create User"}
            </button>
            <button onClick={() => { setShowCreate(false); setCreateError(""); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-slate-900">{u.name}</td>
                  <td className="text-slate-600">{u.email}</td>
                  <td>
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as Role)}
                          className="form-input py-1 text-xs"
                        >
                          {VALID_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                          onClick={() => updateRole.mutate({ userId: u.id, role: editRole })}
                          disabled={updateRole.isPending}
                          className="text-xs text-green-700 font-semibold hover:underline"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:underline">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                  <td className="text-slate-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString("en-US")}
                  </td>
                  <td className="text-right space-x-3">
                    <button
                      onClick={() => { setEditingId(u.id); setEditRole(u.role as Role); }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => { setResetId(u.id); setNewPassword(""); setResetError(""); }}
                      className="text-sm text-slate-500 hover:underline"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reset password inline panel */}
      {resetId && (
        <div className="card p-5 space-y-3 border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-slate-700">
            Reset password for <span className="text-slate-900">{users?.find((u) => u.id === resetId)?.email}</span>
          </p>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="form-input max-w-xs"
            placeholder="New password (min 8 chars)"
          />
          {resetError && <p className="text-sm text-red-600">{resetError}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => resetPassword.mutate({ userId: resetId, newPassword })}
              disabled={resetPassword.isPending || newPassword.length < 8}
              className="btn-primary"
            >
              {resetPassword.isPending ? "Saving…" : "Set Password"}
            </button>
            <button onClick={() => setResetId(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
