"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card p-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#9b5cff]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#9b5cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-white/60">
            If an account exists for <strong className="text-white">{email}</strong>,
            we've sent a password reset link. Check your inbox.
          </p>
          <p className="text-white/30 text-xs">The link expires in 1 hour.</p>
          <Link href="/login" className="btn btn-ghost inline-block mt-4">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">Forgot password</h1>
      <p className="text-white/60 text-sm mt-1">
        Enter your email and we'll send you a link to reset your password.
      </p>
      <form onSubmit={submit} className="card p-5 mt-5 space-y-3">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        {err && <div className="text-[#ff3da6] text-sm">{err}</div>}
        <button className="btn btn-primary w-full justify-center" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <p className="text-center text-sm text-white/50">
          <Link href="/login" className="text-[#9b5cff] hover:underline">Back to login</Link>
        </p>
      </form>
    </div>
  );
}
