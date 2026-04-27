"use client";
import { useCurrency } from "@/lib/currency-store";
import { useEffect, useState } from "react";

/**
 * Storefront currency switcher. Loads the live USD→CAD rate on mount and stores
 * it in the currency store. Shows CAD / USD tabs; persists the user's choice.
 */
export default function CurrencyToggle() {
  const display = useCurrency((s) => s.display);
  const setDisplay = useCurrency((s) => s.setDisplay);
  const setRate = useCurrency((s) => s.setRate);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch the live rate on mount (cached server-side for 6h)
    fetch("/api/forex")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.rate === "number") {
          setRate(d.rate, d.asOf || "", d.source || "");
        }
      })
      .catch(() => {});
  }, [setRate]);

  if (!mounted) return <div className="w-20 h-8" aria-hidden="true" />;

  return (
    <div
      className="inline-flex rounded-full overflow-hidden border text-xs font-semibold"
      style={{ borderColor: "var(--border-strong)", background: "var(--bg-ghost)" }}
      role="group"
      aria-label="Currency"
    >
      {(["CAD", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setDisplay(c)}
          aria-pressed={display === c}
          className="px-3 py-1.5 transition"
          style={{
            background: display === c ? "var(--accent)" : "transparent",
            color: display === c ? "#fff" : "var(--text-muted)",
          }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
