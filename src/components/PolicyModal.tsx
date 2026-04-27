"use client";
import { useEffect, useState } from "react";

type Tab = "terms" | "privacy" | "returns" | "shipping";

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "terms", label: "Terms of Service" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "returns", label: "Returns" },
  { id: "shipping", label: "Shipping" },
];

export default function PolicyModal({ open, onClose, initialTab = "terms" }: PolicyModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [policies, setPolicies] = useState<{
    termsOfService?: string;
    privacyPolicy?: string;
    returnPolicy?: string;
    shippingPolicy?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setLoading(true);
    fetch("/api/policies")
      .then((r) => r.json())
      .then(setPolicies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, initialTab]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const content =
    tab === "terms" ? policies.termsOfService :
    tab === "privacy" ? policies.privacyPolicy :
    tab === "returns" ? policies.returnPolicy :
    policies.shippingPolicy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ background: "var(--bg-surface-1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-xl font-bold">Our policies</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-[var(--bg-ghost-hover)]"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 border-b flex gap-1 overflow-x-auto flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition -mb-px"
              style={{
                borderColor: tab === t.id ? "var(--accent)" : "transparent",
                color: tab === t.id ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <pre
              className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {content || "Policy text not available."}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn btn-primary text-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
