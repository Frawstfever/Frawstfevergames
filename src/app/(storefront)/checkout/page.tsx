"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { money } from "@/lib/money";
import { quoteShipping } from "@/lib/shipping";

interface ProfileAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

function isCompleteAddress(a?: ProfileAddress | null): boolean {
  if (!a) return false;
  return !!(a.line1 && a.city && a.postalCode);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, totalWeight, allowsPickup, clear } = useCart();
  const [mounted, setMounted] = useState(false);

  const canPickup = allowsPickup();
  const [fulfillment, setFulfillment] = useState<"ship" | "pickup">(canPickup ? "pickup" : "ship");
  const [country, setCountry] = useState("CA");
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    line1: "", line2: "", city: "", state: "", postalCode: "",
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/account/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProfileChecked(true);
        if (!data?.name) return;
        setIsLoggedIn(true);
        setHasSavedAddress(isCompleteAddress(data.address));
        setForm((f) => ({
          ...f,
          name: f.name || data.name,
          email: f.email || data.email,
          phone: f.phone || data.phone || "",
          line1: f.line1 || data.address?.line1 || "",
          line2: f.line2 || data.address?.line2 || "",
          city: f.city || data.address?.city || "",
          state: f.state || data.address?.state || "",
          postalCode: f.postalCode || data.address?.postalCode || "",
        }));
        if (data.address?.country) setCountry((c) => c || data.address.country);
      })
      .catch(() => setProfileChecked(true));
  }, []);

  // Static estimate (fallback while live rate loads)
  const estimatedShip = useMemo(
    () => quoteShipping(totalWeight(), country, fulfillment === "pickup"),
    [totalWeight, country, fulfillment]
  );

  // Live Stallion rate (fetched once postal code is known)
  const [liveShip, setLiveShip] = useState<{ amount: number; label: string; source: string } | null>(null);
  const [shipDebug, setShipDebug] = useState<string[]>([]);
  const [ratingShip, setRatingShip] = useState(false);

  useEffect(() => {
    if (fulfillment === "pickup") { setLiveShip(null); return; }
    const weight = totalWeight();
    const pc = form.postalCode.trim();
    if (!pc || weight === 0) { setLiveShip(null); return; }

    const controller = new AbortController();
    const t = setTimeout(() => {
      setRatingShip(true);
      fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightGrams: weight,
          postalCode: pc,
          province: form.state,
          city: form.city,
          country,
        }),
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.amount === "number") {
            setLiveShip({ amount: data.amount, label: data.label, source: data.source });
          }
          if (Array.isArray(data.debug)) setShipDebug(data.debug);
        })
        .catch(() => {})
        .finally(() => setRatingShip(false));
    }, 500); // debounce

    return () => { clearTimeout(t); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.postalCode, form.state, form.city, country, fulfillment, lines.length]);

  const ship = fulfillment === "pickup"
    ? estimatedShip
    : (liveShip ? { ...estimatedShip, amount: liveShip.amount, label: liveShip.label } : estimatedShip);

  const sub = subtotal();
  const total = sub + ship.amount;

  // Address must be saved to profile when shipping (for logged-in users)
  const needsAddressSetup = isLoggedIn && fulfillment === "ship" && !hasSavedAddress;

  if (!mounted) return null;

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Nothing to check out</h1>
        <Link href="/shop" className="btn btn-primary mt-6">Browse games →</Link>
      </div>
    );
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (needsAddressSetup) {
      setError("Please save your delivery address in your profile before checking out.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillment,
          contact: { ...form, country },
          notes,
          items: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            qty: l.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsAddress) {
          setError("Please save your delivery address in your profile before checking out.");
        } else {
          throw new Error(data.error || "Checkout failed");
        }
        return;
      }
      clear();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/checkout/success?n=${encodeURIComponent(data.orderNumber)}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-[1fr_22rem] gap-6">
      <form className="card p-6 space-y-5" onSubmit={placeOrder}>
        <h1 className="text-2xl font-bold">Checkout</h1>

        {/* Delivery location required banner */}
        {needsAddressSetup && (
          <Link
            href="/account/profile#address"
            className="rounded-lg p-4 flex items-center gap-4 border transition hover:shadow-md group"
            style={{
              background: "rgba(251, 191, 36, 0.08)",
              borderColor: "rgba(251, 191, 36, 0.4)",
            }}
          >
            {/* Warning icon */}
            <svg className="w-6 h-6 flex-shrink-0" style={{ color: "var(--warn)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>

            <div className="flex-1 min-w-0">
              <div className="font-semibold" style={{ color: "var(--warn)" }}>
                Delivery address required
              </div>
              <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Tap to set up your delivery location before placing an order.
              </div>
            </div>

            {/* Arrow button */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition group-hover:translate-x-1"
              style={{ background: "var(--warn)", color: "#1a0d2e" }}
              aria-label="Go to delivery location"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
        )}

        <div>
          <div className="label">Fulfillment</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFulfillment("ship")}
              className={`btn ${fulfillment === "ship" ? "btn-primary" : "btn-ghost"} justify-center`}
            >
              🚚 Ship to me
            </button>
            <button
              type="button"
              disabled={!canPickup}
              onClick={() => setFulfillment("pickup")}
              className={`btn ${fulfillment === "pickup" ? "btn-primary" : "btn-ghost"} justify-center disabled:opacity-40`}
              title={canPickup ? "" : "One or more items are ship-only"}
            >
              📍 Local pickup
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {fulfillment === "ship" && (
            <div>
              <label className="label">Country</label>
              <select className="select" value="CA" disabled>
                <option value="CA">Canada</option>
              </select>
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                We currently ship within Canada only.
              </p>
            </div>
          )}
        </div>

        {fulfillment === "ship" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="label mb-0">Delivery location</div>
              {isLoggedIn && hasSavedAddress && (
                <Link
                  href="/account/profile"
                  className="text-xs hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  Edit in profile
                </Link>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">Address line 1</label>
                <input required disabled={isLoggedIn} className="input" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address line 2 (optional)</label>
                <input disabled={isLoggedIn} className="input" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
              </div>
              <div>
                <label className="label">City</label>
                <input required disabled={isLoggedIn} className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="label">State / Region</label>
                <input disabled={isLoggedIn} className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <label className="label">Postal code</label>
                <input required disabled={isLoggedIn} className="input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              </div>
            </div>
            {isLoggedIn && hasSavedAddress && (
              <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
                Using the address saved to your profile. Update it in your profile to change.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="label">Order notes (optional)</label>
          <textarea
            className="textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pickup time preference, special requests…"
          />
        </div>

        {error && <div className="text-sm" style={{ color: "var(--danger)" }}>{error}</div>}

        <button
          type="submit"
          disabled={submitting || needsAddressSetup || !profileChecked}
          className="btn btn-primary w-full justify-center"
        >
          {submitting ? "Placing order…" : `Place order · ${money(total)}`}
        </button>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          We'll redirect you to Stripe for secure payment. Stock is reserved for 24 hours.
        </p>
      </form>

      <aside className="card p-5 h-fit sticky top-20 space-y-3">
        <div className="font-semibold">Order summary</div>
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.variantId} className="flex justify-between text-sm">
              <div className="min-w-0 pr-2">
                <div className="truncate">{l.title}</div>
                <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {l.platform} · {l.conditionLabel} × {l.qty}
                </div>
              </div>
              <div>{money(l.price * l.qty)}</div>
            </div>
          ))}
        </div>
        <hr style={{ borderColor: "var(--border)" }} />
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
          <span>{money(sub)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>
            {ratingShip ? "Getting live rate…" : ship.label}
          </span>
          <span>{ship.amount === 0 ? "Free" : money(ship.amount)}</span>
        </div>

        {/* Debug info when falling back to estimate (visible only to clarify why) */}
        {!ratingShip && fulfillment === "ship" && !liveShip && shipDebug.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer" style={{ color: "var(--text-faint)" }}>
              Why an estimate? (live rates unavailable)
            </summary>
            <ul className="mt-2 space-y-1 pl-4 list-disc" style={{ color: "var(--text-muted)" }}>
              {shipDebug.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </details>
        )}

        <div className="flex justify-between font-bold text-lg pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </aside>
    </div>
  );
}
