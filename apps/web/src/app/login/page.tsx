"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { trpc } from "@/lib/trpc";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("signin");

  // Sign-in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sign-up state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  const register = trpc.users.register.useMutation({
    onSuccess: () => {
      setRegSuccess("Account created! You can now sign in.");
      setTab("signin");
      setEmail(regEmail);
      setRegName(""); setRegEmail(""); setRegPassword(""); setRegConfirm("");
    },
    onError: (err) => setRegError(err.message),
  });

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email, password, callbackUrl: "/dashboard", redirect: false,
    });
    setLoading(false);
    if (result?.error) setError("Invalid email or password.");
    else if (result?.url) window.location.href = result.url;
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
    register.mutate({ name: regName, email: regEmail, password: regPassword });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">OSHA Records</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Workplace Safety<br />Recordkeeping<br />
            <span className="text-blue-400">Made Compliant.</span>
          </h1>
          <p className="mt-5 text-slate-400 text-base leading-relaxed">
            Full 29 CFR Part 1904 compliance. Manage injury logs, generate OSHA forms, and stay audit-ready.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[
            { label: "OSHA Form 300", sub: "Injury & Illness Log" },
            { label: "OSHA Form 300A", sub: "Annual Summary" },
            { label: "OSHA Form 301", sub: "Incident Report" },
            { label: "ITA Ready", sub: "Electronic Submission" },
          ].map((f) => (
            <div key={f.label} className="bg-white/5 rounded-xl p-3.5 border border-white/10 backdrop-blur-sm">
              <p className="text-white text-sm font-semibold">{f.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-lg">OSHA Records</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tab === "signin"
                ? "Sign in to access your recordkeeping dashboard."
                : "Create an account to get started."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-8 gap-1">
            <button
              onClick={() => { setTab("signin"); setError(""); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === "signin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("signup"); setRegError(""); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sign In */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="auth-btn w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : "Sign in"}
              </button>
            </form>
          )}

          {/* Sign Up */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-5">
              {regError && (
                <div className="flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {regError}
                </div>
              )}
              {regSuccess && (
                <div className="flex items-center gap-2.5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {regSuccess}
                </div>
              )}
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
                Your account will have <strong>Reviewer</strong> access by default. To get elevated permissions, contact your organization&apos;s admin.
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                <input
                  type="text" autoComplete="name" required
                  value={regName} onChange={(e) => setRegName(e.target.value)}
                  className="auth-input"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email" autoComplete="email" required
                  value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                  className="auth-input"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password <span className="text-slate-400 font-normal">(min 8 chars)</span></label>
                <input
                  type="password" autoComplete="new-password" required minLength={8}
                  value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                <input
                  type="password" autoComplete="new-password" required
                  value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={register.isLoading} className="auth-btn w-full">
                {register.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Creating account…
                  </span>
                ) : "Create account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
