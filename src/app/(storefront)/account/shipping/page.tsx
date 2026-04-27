"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { money } from "@/lib/money";

type Bucket = "all" | "pending" | "transit" | "delivered" | "pickup" | "cancelled";

const BUCKETS: { key: Bucket; label: string; color: string; hint: string }[] = [
  { key: "pending",   label: "Preparing",  color: "var(--warn)",    hint: "Paid, waiting to ship" },
  { key: "transit",   label: "In transit", color: "var(--info)",    hint: "On the way to you" },
  { key: "delivered", label: "Delivered",  color: "var(--ok)",      hint: "Completed orders" },
  { key: "pickup",    label: "Pickup",     color: "#00e5ff",        hint: "Local pickup" },
  { key: "cancelled", label: "Cancelled",  color: "var(--danger)",  hint: "Cancelled orders" },
];

function trackingUrlFor(carrier?: string, number?: string): string | undefined {
  if (!number) return undefined;
  const c = (carrier || "").toLowerCase();
  if (c.includes("canada post")) return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(number)}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`;
  if (c.includes("purolator")) return `https://www.purolator.com/en/shipping/tracker?pin=${encodeURIComponent(number)}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`;
  if (c.includes("stallion")) return `https://stallionexpress.ca/track/${encodeURIComponent(number)}`;
  return undefined;
}

export default function MyShippingPage() {
  const router = useRouter();
  const [bucket, setBucket] = useState<Bucket>("all");
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<Bucket, number>>({} as Record<Bucket, number>);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/account/shipping?bucket=${bucket}`);
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setItems(data.items || []);
      setCounts(data.counts || ({} as Record<Bucket, number>));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [bucket, router]);

  useEffect(() => { load(); }, [load]);

  const totalAll =
    (counts.pending || 0) +
    (counts.transit || 0) +
    (counts.delivered || 0) +
    (counts.pickup || 0) +
    (counts.cancelled || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shipping</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Track the shipping status of all your orders.
          </p>
        </div>
        <Link href="/account" className="btn btn-ghost text-sm">← Account</Link>
      </div>

      {/* Bucket cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <BucketCard
          active={bucket === "all"}
          onClick={() => setBucket("all")}
          label="All"
          count={totalAll}
          color="var(--text-muted)"
        />
        {BUCKETS.map((b) => (
          <BucketCard
            key={b.key}
            active={bucket === b.key}
            onClick={() => setBucket(b.key)}
            label={b.label}
            count={counts[b.key] ?? 0}
            color={b.color}
          />
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-6 w-6" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
               style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
            </svg>
          </div>
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>
            {bucket === "all"
              ? "You haven't placed any orders yet."
              : `No orders in "${BUCKETS.find((b) => b.key === bucket)?.label || bucket}".`}
          </p>
          <Link href="/shop" className="btn btn-primary">Browse games</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((o) => (
            <ShipmentCard key={o._id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

// —————————————————————————————————————————————

function BucketCard({ label, count, color, active, onClick }: {
  label: string; count: number; color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card p-3 text-left transition"
      style={{
        borderColor: active ? color : "var(--border)",
        background: active ? "var(--bg-ghost-hover)" : "var(--bg-card)",
      }}
    >
      <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color }}>
        {label}
      </div>
      <div className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
        {count}
      </div>
    </button>
  );
}

function ShipmentCard({ order }: { order: any }) {
  const url = trackingUrlFor(order.trackingCarrier, order.trackingNumber);
  const isShip = order.fulfillment === "ship";

  const steps = isShip
    ? [
        { key: "placed",    label: "Placed",    met: true },
        { key: "paid",      label: "Paid",      met: ["paid", "shipped", "completed"].includes(order.status) },
        { key: "shipped",   label: "Shipped",   met: ["shipped", "completed"].includes(order.status) },
        { key: "delivered", label: "Delivered", met: order.status === "completed" },
      ]
    : [
        { key: "placed",    label: "Placed",        met: true },
        { key: "paid",      label: "Paid",          met: ["paid", "ready_pickup", "completed"].includes(order.status) },
        { key: "ready",     label: "Ready",         met: ["ready_pickup", "completed"].includes(order.status) },
        { key: "picked_up", label: "Picked up",     met: order.status === "completed" },
      ];

  const statusLabel =
    order.status === "cancelled"    ? "Cancelled" :
    order.status === "completed"    ? (isShip ? "Delivered" : "Picked up") :
    order.status === "shipped"      ? "In transit" :
    order.status === "ready_pickup" ? "Ready for pickup" :
    order.status === "paid"         ? (isShip ? "Preparing" : "Paid") :
                                      "Pending";

  const statusColor =
    order.status === "cancelled"    ? "var(--danger)" :
    order.status === "completed"    ? "var(--ok)" :
    order.status === "shipped"      ? "var(--info)" :
    order.status === "ready_pickup" ? "#00e5ff" :
    order.status === "paid"         ? "var(--warn)" :
                                      "var(--text-muted)";

  const isCancelled = order.status === "cancelled";

  return (
    <div className="card p-5" style={{ opacity: isCancelled ? 0.6 : 1 }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="font-mono font-bold">{order.orderNumber}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            {new Date(order.createdAt).toLocaleDateString()} · {money(order.total)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip" style={{ color: statusColor, borderColor: "currentColor", background: "transparent", fontWeight: 600 }}>
            {statusLabel}
          </span>
          <span className="chip">{isShip ? "🚚 Ship" : "📍 Pickup"}</span>
        </div>
      </div>

      {/* Progress bar */}
      {!isCancelled && (
        <div className="mb-4 rounded-lg p-3 border" style={{ background: "var(--bg-ghost)", borderColor: "var(--border)" }}>
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s.key} className="flex-1 flex items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition"
                  style={{
                    background: s.met ? "var(--accent)" : "var(--bg-surface-2)",
                    color: s.met ? "#fff" : "var(--text-faint)",
                    border: s.met ? "none" : "1px solid var(--border-strong)",
                  }}
                >
                  {s.met ? "✓" : i + 1}
                </div>
                <div className="ml-2 text-xs flex-1 min-w-0">
                  <div style={{ color: s.met ? "var(--text-primary)" : "var(--text-faint)", fontWeight: s.met ? 600 : 400 }}>
                    {s.label}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1" style={{ background: steps[i + 1].met ? "var(--accent)" : "var(--border)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking block */}
      {isShip && order.trackingNumber && (
        <div className="mb-4 rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap"
             style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-ring)" }}>
          <div className="flex-1 min-w-0">
            <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
              {order.trackingCarrier || "Canada Post"} tracking
            </div>
            <div className="font-mono font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {order.trackingNumber}
            </div>
          </div>
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary text-sm">
              Track package →
            </a>
          )}
        </div>
      )}

      {/* Empty tracking state (paid but not shipped yet) */}
      {isShip && !order.trackingNumber && order.status === "paid" && (
        <div className="mb-4 text-xs p-3 rounded-lg" style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
          📦 Your order is being prepared. Tracking info will appear here once it ships (within 5 business days).
        </div>
      )}

      {/* Shipping address summary */}
      {isShip && (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--text-faint)" }}>Ship to: </span>
          {order.contact?.line1}
          {order.contact?.line2 ? `, ${order.contact.line2}` : ""}
          , {order.contact?.city}, {order.contact?.state} {order.contact?.postalCode}
        </div>
      )}

      {/* Items */}
      <div className="mt-3 flex flex-wrap gap-2">
        {order.items.slice(0, 6).map((it: any, i: number) => (
          it.image ? (
            <img
              key={i}
              src={it.image}
              alt={it.title}
              title={`${it.title} (x${it.qty})`}
              className="w-10 h-14 object-cover rounded border"
              style={{ borderColor: "var(--border)" }}
            />
          ) : (
            <div
              key={i}
              className="w-10 h-14 rounded border flex items-center justify-center text-[9px] text-center px-1"
              style={{ borderColor: "var(--border)", background: "var(--bg-ghost)", color: "var(--text-faint)" }}
              title={`${it.title} (x${it.qty})`}
            >
              {it.title.slice(0, 10)}
            </div>
          )
        ))}
        {order.items.length > 6 && (
          <div
            className="w-10 h-14 rounded border flex items-center justify-center text-xs"
            style={{ borderColor: "var(--border)", background: "var(--bg-ghost)", color: "var(--text-muted)" }}
          >
            +{order.items.length - 6}
          </div>
        )}
      </div>

      {/* Footer: link to details */}
      <div className="flex justify-end mt-3">
        <Link href="/account/orders" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
          View full order details →
        </Link>
      </div>
    </div>
  );
}
