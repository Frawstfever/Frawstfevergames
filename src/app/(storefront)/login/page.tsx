"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return <Suspense fallback={null}><LoginContent /></Suspense>;
}

function LoginContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const justVerified = sp.get("verified") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setNeedsVerification(false);
    try {
      const res = await fetch("/api/auth/customer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.status === 403 && data.needsVerification) {
        setNeedsVerification(true);
        // Send a new code automatically
        fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).catch(() => {});
        return;
      }
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(data.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-white/60 text-sm mt-1">Welcome back to Frawst Fever Games.</p>
      {justVerified && (
        <div className="card p-3 mt-5 border border-green-500/30 text-sm text-green-400 font-semibold text-center">
          Email verified! You can now sign in.
        </div>
      )}
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
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {err && <div className="text-[#ff3da6] text-sm">{err}</div>}
        {needsVerification && (
          <div className="card p-3 border border-yellow-500/30 text-sm space-y-2">
            <p className="text-yellow-400 font-semibold">Email not verified</p>
            <p className="text-white/60">
              We sent a verification code to your email.{" "}
              <button
                type="button"
                onClick={() => router.push(`/verify-email?email=${encodeURIComponent(email)}`)}
                className="text-[#9b5cff] hover:underline"
              >
                Enter code
              </button>
            </p>
          </div>
        )}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-[#9b5cff] hover:underline">
            Forgot password?
          </Link>
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-white/50">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#9b5cff] hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
