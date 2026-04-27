"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PolicyModal from "@/components/PolicyModal";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<"terms" | "privacy" | "returns" | "shipping">("terms");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verification code state
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    if (!agreed) {
      setErr("Please accept the Terms and Privacy Policy to continue");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setStep("verify");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
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
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || "";
    }
    setCode(newCode);
    if (pasted.length === 6) {
      verifyCode(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }

  async function verifyCode(fullCode: string) {
    setVerifying(true);
    setVerifyErr(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      router.push("/login?verified=1");
    } catch (e: unknown) {
      setVerifyErr(e instanceof Error ? e.message : "Verification failed");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function resendCode() {
    setResending(true);
    setVerifyErr(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerifyErr(null);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (e: unknown) {
      setVerifyErr(e instanceof Error ? e.message : "Failed to resend");
    } finally {
      setResending(false);
    }
  }

  // Step 2: Verification code input
  if (step === "verify") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card p-8 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#9b5cff]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#9b5cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Enter verification code</h1>
          <p className="text-white/60 text-sm">
            We sent a 6-digit code to <strong className="text-white">{email}</strong>
          </p>

          {/* 6-digit code input */}
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

          {verifyErr && <div className="text-[#ff3da6] text-sm">{verifyErr}</div>}

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

  // Step 1: Signup form
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <p className="text-white/60 text-sm mt-1">Join Frawst Fever Games to start shopping.</p>
      <form onSubmit={submit} className="card p-5 mt-5 space-y-3">
        <div>
          <label className="label">Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
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
            placeholder="At least 8 characters"
            required
          />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>
        {/* Policy agreement */}
        <label className="flex items-start gap-2.5 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => { setPolicyInitialTab("terms"); setPolicyOpen(true); }}
              className="hover:underline font-medium"
              style={{ color: "var(--accent)" }}
            >
              Terms of Service
            </button>
            {" "}and{" "}
            <button
              type="button"
              onClick={() => { setPolicyInitialTab("privacy"); setPolicyOpen(true); }}
              className="hover:underline font-medium"
              style={{ color: "var(--accent)" }}
            >
              Privacy Policy
            </button>
            .
          </span>
        </label>

        {err && <div className="text-sm" style={{ color: "var(--danger)" }}>{err}</div>}
        <button
          className="btn btn-primary w-full justify-center"
          disabled={loading || !agreed}
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="hover:underline" style={{ color: "var(--accent)" }}>Sign in</Link>
        </p>
      </form>

      <PolicyModal
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
        initialTab={policyInitialTab}
      />
    </div>
  );
}
