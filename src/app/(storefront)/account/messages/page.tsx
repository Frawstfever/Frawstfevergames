"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyMessagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/messages")
      .then(async (r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => { if (data?.items) setItems(data.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My messages</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            A log of all the messages you've sent through the contact form.
          </p>
        </div>
        <Link href="/account" className="btn btn-ghost text-sm">← Account</Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-6 w-6" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
               style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p style={{ color: "var(--text-muted)" }} className="mb-4">You haven't sent any messages yet.</p>
          <Link href="/contact" className="btn btn-primary">Contact us</Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((m) => {
            const isOpen = expandedId === m._id;
            return (
              <div key={m._id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedId(isOpen ? null : m._id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-3 transition"
                  style={{ background: isOpen ? "var(--bg-ghost)" : "transparent" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{m.title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                    {!isOpen && (
                      <div className="text-sm mt-2 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                        {m.content}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {m.read ? (
                      <span className="chip" style={{ color: "var(--ok)" }}>Read</span>
                    ) : (
                      <span className="chip">Pending</span>
                    )}
                    <svg className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "var(--text-faint)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
