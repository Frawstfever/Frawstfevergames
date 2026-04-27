"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const emailParam = sp.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token || !emailParam) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card p-8 space-y-4">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-white/60">This link is invalid or has expired.</p>
          <Link href="/forgot-password" className="btn btn-primary inline-block mt-4">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card p-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Password reset!</h1>
          <p className="text-white/60">Your password has been updated. You can now sign in.</p>
          <Link href="/login" className="btn btn-primary inline-block mt-4">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-white/60 text-sm mt-1">Choose a new password for your account.</p>
      <form onSubmit={submit} className="card p-5 mt-5 space-y-3">
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>
        {err && <div className="text-[#ff3da6] text-sm">{err}</div>}
        <button className="btn btn-primary w-full justify-center" disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
