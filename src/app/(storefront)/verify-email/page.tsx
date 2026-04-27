"use client";
import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialEmail = sp.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d) && newCode.join("").length === 6) {
      verifyCode(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
    setCode(newCode);
    if (pasted.length === 6) verifyCode(pasted);
    else inputRefs.current[pasted.length]?.focus();
  }

  async function verifyCode(fullCode: string) {
    if (!email) { setErr("Please enter your email"); return; }
    setVerifying(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setSuccess(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Verification failed");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function resendCode() {
    if (!email) { setErr("Please enter your email"); return; }
    setResending(true);
    setErr(null);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setErr("Failed to resend code");
    } finally {
      setResending(false);
    }
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
          <h1 className="text-2xl font-bold">Email verified!</h1>
          <p className="text-white/60">Your account is ready. You can now sign in.</p>
          <Link href="/login" className="btn btn-primary inline-block mt-4">
            Sign in to your account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="card p-8 space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#9b5cff]/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#9b5cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-white/60 text-sm">
          Enter the 6-digit code sent to your email.
        </p>

        {!initialEmail && (
          <div className="text-left">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        )}

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={verifying}
              className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-white/20 bg-white/5
                         focus:border-[#9b5cff] focus:ring-1 focus:ring-[#9b5cff] outline-none transition"
            />
          ))}
        </div>

        {verifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Verifying…
          </div>
        )}

        {err && <div className="text-[#ff3da6] text-sm">{err}</div>}

        <p className="text-white/40 text-sm">
          Didn't receive the code?{" "}
          <button
            onClick={resendCode}
            disabled={resending}
            className="text-[#9b5cff] hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>

        <p className="text-white/30 text-xs">Code expires in 15 minutes</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
