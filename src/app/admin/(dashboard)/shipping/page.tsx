"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { money } from "@/lib/money";

type Bucket = "all" | "ready" | "transit" | "delivered" | "pickup" | "cancelled";
type Row = Record<string, unknown> & {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  fulfillment: "ship" | "pickup";
  total: number;
  items: Array<{ title: string; qty: number; image?: string }>;
  contact: { name: string; email: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; country?: string };
  trackingNumber?: string;
  trackingCarrier?: string;
  shippedEmailSentAt?: string;
};

const BUCKETS: { key: Bucket; label: string; color: string }[] = [
  { key: "ready",     label: "Ready to ship", color: "var(--warn)" },
  { key: "transit",   label: "In transit",    color: "var(--info)" },
  { key: "delivered", label: "Delivered",     color: "var(--ok)" },
  { key: "pickup",    label: "Pickup",        color: "var(--neon-2, #00e5ff)" },
  { key: "cancelled", label: "Cancelled",     color: "var(--danger)" },
  { key: "all",       label: "All",           color: "var(--text-muted)" },
];

const CARRIERS = ["Canada Post", "UPS", "Purolator", "FedEx", "Stallion Express", "Other"];

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

export default function AdminShippingPage() {
  const [bucket, setBucket] = useState<Bucket>("ready");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<Bucket, number>>({} as Record<Bucket, number>);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ bucket, pageSize: "100" });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/shipping?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setCounts(data.counts || ({} as Record<Bucket, number>));
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [bucket, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Shipping</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage tracking and shipping status across all orders.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, tracking…"
            className="input"
            style={{ width: "18rem" }}
          />
          <button type="submit" className="btn btn-ghost">Search</button>
        </form>
      </div>

      {/* Bucket stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        {BUCKETS.map((b) => {
          const count = b.key === "all" ? total : (counts[b.key] ?? 0);
          const active = bucket === b.key;
          return (
            <button
              key={b.key}
              onClick={() => setBucket(b.key)}
              className="card p-4 text-left transition"
              style={{
                borderColor: active ? b.color : "var(--border)",
                background: active ? "var(--bg-ghost-hover)" : "var(--bg-card)",
              }}
            >
              <div className="text-xs font-medium uppercase tracking-wide" style={{ color: b.color }}>
                {b.label}
              </div>
              <div className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-6 w-6" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center" style={{ color: "var(--text-muted)" }}>
          No orders in this bucket.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <ShippingRow key={row._id} row={row} onRefresh={fetchData} />
          ))}
        </div>
      )}
    </div>
  );
}

// —————————————————————————————————————————————
// Row component
// —————————————————————————————————————————————

function ShippingRow({ row, onRefresh }: { row: Row; onRefresh: () => void }) {
  const [tracking, setTracking] = useState(row.trackingNumber || "");
  const [carrier, setCarrier] = useState(row.trackingCarrier || "Canada Post");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; s: string } | null>(null);

  async function patch(payload: Record<string, unknown>) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${row._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      onRefresh();
      return true;
    } catch (e: unknown) {
      setMsg({ t: "err", s: e instanceof Error ? e.message : "Failed" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndShip() {
    if (!tracking.trim()) {
      setMsg({ t: "err", s: "Enter a tracking number first." });
      return;
    }
    const ok = await patch({ status: "shipped", trackingNumber: tracking.trim(), trackingCarrier: carrier });
    if (ok) setMsg({ t: "ok", s: "Shipped. Email sent." });
    setTimeout(() => setMsg(null), 3000);
  }

  async function saveTracking() {
    const ok = await patch({ trackingNumber: tracking.trim(), trackingCarrier: carrier });
    if (ok) setMsg({ t: "ok", s: "Tracking saved." });
    setTimeout(() => setMsg(null), 2500);
  }

  async function markDelivered() {
    const ok = await patch({ status: "completed" });
    if (ok) setMsg({ t: "ok", s: "Marked delivered." });
    setTimeout(() => setMsg(null), 2500);
  }

  async function markReadyPickup() {
    const ok = await patch({ status: "ready_pickup" });
    if (ok) setMsg({ t: "ok", s: "Marked ready for pickup." });
    setTimeout(() => setMsg(null), 2500);
  }

  async function cancel() {
    if (!confirm(`Cancel order ${row.orderNumber}? (Stock will not be restored automatically)`)) return;
    const ok = await patch({ status: "cancelled" });
    if (ok) setMsg({ t: "ok", s: "Cancelled." });
    setTimeout(() => setMsg(null), 2500);
  }

  const url = trackingUrlFor(carrier, tracking);
  const itemSummary = row.items.slice(0, 3).map((i) => i.title).join(", ") +
    (row.items.length > 3 ? ` (+${row.items.length - 3})` : "");
  const totalQty = row.items.reduce((a, i) => a + i.qty, 0);

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Link
              href="/admin/orders"
              className="font-mono text-sm font-bold hover:underline"
              style={{ color: "var(--text-primary)" }}
            >
              {row.orderNumber}
            </Link>
            <StatusChip status={row.status} fulfillment={row.fulfillment} />
          </div>
          <div className="text-xs mb-2" style={{ color: "var(--text-faint)" }}>
            {new Date(row.createdAt).toLocaleString()}
          </div>
          <div className="text-sm"><b>{row.contact.name}</b> · {row.contact.email}</div>
          {row.fulfillment === "ship" ? (
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              🚚 {row.contact.line1}
              {row.contact.line2 ? `, ${row.contact.line2}` : ""}
              , {row.contact.city}, {row.contact.state} {row.contact.postalCode}
            </div>
          ) : (
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>📍 Local pickup</div>
          )}
          <div className="text-xs mt-2 truncate" style={{ color: "var(--text-muted)" }}>
            {row.items.length} item{row.items.length === 1 ? "" : "s"} · {totalQty} unit{totalQty === 1 ? "" : "s"} · {itemSummary}
          </div>
        </div>

        {/* Right: total + actions */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xl font-bold">{money(row.total)}</div>
          <div className="mt-3 space-y-2" style={{ minWidth: "20rem" }}>
            {/* Ship flow */}
            {row.fulfillment === "ship" && row.status !== "cancelled" && (
              <>
                <div className="flex gap-2">
                  <select
                    className="select flex-shrink-0"
                    style={{ width: "10rem" }}
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    disabled={saving}
                  >
                    {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    className="input flex-1"
                    placeholder="Tracking number"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="flex gap-2 justify-end flex-wrap">
                  {row.trackingNumber && url && (
                    <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost text-xs">
                      Track →
                    </a>
                  )}
                  <button onClick={saveTracking} disabled={saving} className="btn btn-ghost text-xs">
                    Save tracking
                  </button>
                  {row.status === "paid" && (
                    <button onClick={saveAndShip} disabled={saving || !tracking.trim()} className="btn btn-primary text-xs">
                      Mark as shipped
                    </button>
                  )}
                  {row.status === "shipped" && (
                    <button onClick={markDelivered} disabled={saving} className="btn btn-primary text-xs">
                      Mark delivered
                    </button>
                  )}
                </div>
                {row.shippedEmailSentAt && (
                  <div className="text-xs text-right" style={{ color: "var(--text-faint)" }}>
                    ✓ Shipped email sent {new Date(row.shippedEmailSentAt).toLocaleDateString()}
                  </div>
                )}
              </>
            )}

            {/* Pickup flow */}
            {row.fulfillment === "pickup" && row.status !== "cancelled" && (
              <div className="flex gap-2 justify-end flex-wrap">
                {row.status === "paid" && (
                  <button onClick={markReadyPickup} disabled={saving} className="btn btn-primary text-xs">
                    Ready for pickup
                  </button>
                )}
                {row.status === "ready_pickup" && (
                  <button onClick={markDelivered} disabled={saving} className="btn btn-primary text-xs">
                    Mark picked up
                  </button>
                )}
              </div>
            )}

            {row.status !== "cancelled" && row.status !== "completed" && (
              <div className="flex justify-end">
                <button onClick={cancel} disabled={saving} className="btn btn-ghost text-xs" style={{ color: "var(--danger)" }}>
                  Cancel order
                </button>
              </div>
            )}

            {msg && (
              <div className="text-xs text-right" style={{ color: msg.t === "ok" ? "var(--ok)" : "var(--danger)" }}>
                {msg.s}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status, fulfillment }: { status: string; fulfillment: string }) {
  const label = fulfillment === "pickup" && status === "ready_pickup" ? "Ready for pickup" : status.replace("_", " ");
  const color =
    status === "paid"         ? "var(--warn)" :
    status === "shipped"      ? "var(--info)" :
    status === "completed"    ? "var(--ok)" :
    status === "cancelled"    ? "var(--danger)" :
    status === "ready_pickup" ? "var(--neon-2, #00e5ff)" :
                                "var(--text-muted)";
  return (
    <span
      className="chip"
      style={{
        color,
        borderColor: "currentColor",
        background: "transparent",
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}
