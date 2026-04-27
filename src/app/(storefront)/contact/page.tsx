"use client";
import { useState, useEffect } from "react";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Pre-fill email if user is logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.email) setEmail(data.email); })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (title.trim().length < 3) { setErr("Title is too short"); return; }
    if (content.trim().length < 10) { setErr("Message is too short"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSent(true);
      setTitle("");
      setContent("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card p-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
               style={{ background: "rgba(74, 222, 128, 0.15)" }}>
            <svg className="w-8 h-8" style={{ color: "var(--ok)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Message sent!</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Thanks for reaching out. We've sent a confirmation to
            <strong style={{ color: "var(--text-primary)" }}> {email}</strong>.
            We'll get back to you as soon as possible.
          </p>
          <button
            onClick={() => setSent(false)}
            className="btn btn-ghost mt-4"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Contact us</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Questions about an order, a product, or anything else? We'd love to hear from you.
        </p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Your email</label>
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
          <label className="label">Title</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's this about?"
            maxLength={200}
            required
          />
        </div>
        <div>
          <label className="label">
            Message <span className="font-normal" style={{ color: "var(--text-faint)" }}>({content.length}/5000)</span>
          </label>
          <textarea
            className="textarea"
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 5000))}
            placeholder="Write your message here…"
            required
          />
        </div>

        {err && <div className="text-sm" style={{ color: "var(--danger)" }}>{err}</div>}

        <button className="btn btn-primary w-full justify-center" disabled={loading}>
          {loading ? "Sending…" : "Send message"}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
          We'll email you a copy of your message for your records.
        </p>
      </form>
    </div>
  );
}
