"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { money } from "@/lib/money";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { lines, setQty, remove, subtotal, totalWeight } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
             style={{ background: "var(--bg-ghost)" }}>
          <svg className="w-10 h-10" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>Time to grab some classics.</p>
        <Link href="/shop" className="btn btn-primary mt-6">Browse games →</Link>
      </div>
    );
  }

  const itemCount = lines.reduce((a, l) => a + l.qty, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-[1fr_22rem] gap-6">
      <div>
        <div className="flex items-baseline justify-between mb-5">
          <h1 className="text-3xl font-bold">Cart</h1>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="card overflow-hidden">
          {lines.map((l, idx) => (
            <div
              key={l.variantId}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 ${idx > 0 ? "border-t" : ""}`}
              style={{ borderColor: "var(--border)" }}
            >
              {/* Image + title block */}
              <div className="flex gap-4 flex-1 min-w-0">
                <Link
                  href={`/shop/${l.slug}`}
                  className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 border"
                  style={{ borderColor: "var(--border)", background: "var(--bg-ghost)" }}
                >
                  {l.image ? (
                    <img src={l.image} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs"
                         style={{ color: "var(--text-faint)" }}>
                      No image
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <Link
                      href={`/shop/${l.slug}`}
                      className="font-semibold hover:underline line-clamp-2 text-base"
                    >
                      {l.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="chip">{l.platform}</span>
                      <span className="chip">{l.conditionLabel}</span>
                    </div>
                    <div className="text-xs font-mono mt-1.5" style={{ color: "var(--text-faint)" }}>
                      SKU · {l.sku}
                    </div>
                  </div>
                  <div className="text-sm sm:hidden mt-3" style={{ color: "var(--text-muted)" }}>
                    {money(l.price)} each
                  </div>
                </div>
              </div>

              {/* Quantity + price + remove */}
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                {/* Quantity stepper */}
                <div
                  className="inline-flex items-center rounded-lg overflow-hidden border"
                  style={{ borderColor: "var(--border-input)", background: "var(--bg-input)" }}
                >
                  <button
                    onClick={() => setQty(l.variantId, Math.max(1, l.qty - 1))}
                    disabled={l.qty <= 1}
                    className="w-9 h-9 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-ghost-hover)]"
                    aria-label="Decrease quantity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={l.qty}
                    onChange={(e) => setQty(l.variantId, Math.max(1, Number(e.target.value) || 1))}
                    className="w-12 h-9 text-center bg-transparent border-0 outline-none font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                    aria-label="Quantity"
                  />
                  <button
                    onClick={() => setQty(l.variantId, l.qty + 1)}
                    className="w-9 h-9 flex items-center justify-center transition hover:bg-[var(--bg-ghost-hover)]"
                    aria-label="Increase quantity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Price */}
                <div className="text-right min-w-[5rem]">
                  <div className="font-bold text-lg">{money(l.price * l.qty)}</div>
                  <div className="hidden sm:block text-xs" style={{ color: "var(--text-faint)" }}>
                    {money(l.price)} each
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => remove(l.variantId)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-[var(--bg-ghost-hover)]"
                  style={{ color: "var(--text-faint)" }}
                  aria-label="Remove item"
                  title="Remove"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="card p-6 h-fit lg:sticky lg:top-24 space-y-4">
        <h2 className="font-bold text-lg">Order summary</h2>

        <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between text-sm pt-2">
            <span style={{ color: "var(--text-muted)" }}>
              Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
            <span className="font-semibold">{money(subtotal())}</span>
          </div>
          <div className="flex justify-between text-xs" style={{ color: "var(--text-faint)" }}>
            <span>Estimated weight</span>
            <span>{(totalWeight() / 1000).toFixed(2)} kg</span>
          </div>
        </div>

        <div className="text-xs p-3 rounded-lg" style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
          Shipping &amp; taxes calculated at checkout.
        </div>

        <Link href="/checkout" className="btn btn-primary w-full justify-center">
          Checkout · {money(subtotal())}
        </Link>
        <Link href="/shop" className="btn btn-ghost w-full justify-center">
          Keep shopping
        </Link>
      </aside>
    </div>
  );
}
