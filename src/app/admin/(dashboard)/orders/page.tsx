import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { money } from "@/lib/money";
import OrderAdminControls from "@/components/admin/OrderAdminControls";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--warn)",
  paid: "var(--info)",
  ready_pickup: "var(--neon-2, #00e5ff)",
  shipped: "#c084fc",
  completed: "var(--ok)",
  cancelled: "var(--danger)",
};

export default async function OrdersAdmin() {
  await connectDB();
  const orders = await Order.find({}).sort({ createdAt: -1 }).limit(200).lean();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders ({orders.length})</h1>
      <div className="space-y-3">
        {orders.map((o: any) => (
          <div key={o._id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              {/* Left: order info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-bold">{o.orderNumber}</span>
                  <span
                    className="chip"
                    style={{
                      color: STATUS_COLOR[o.status],
                      borderColor: "currentColor",
                      background: "transparent",
                    }}
                  >
                    {o.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                  {new Date(o.createdAt).toLocaleString()}
                </div>

                <div className="mt-2 text-sm">
                  <b>{o.contact?.name}</b> · {o.contact?.email}
                  {o.contact?.phone ? ` · ${o.contact.phone}` : ""}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {o.fulfillment === "pickup" ? (
                    "📍 Local pickup"
                  ) : (
                    <>
                      🚚 {o.contact?.line1}
                      {o.contact?.line2 ? `, ${o.contact.line2}` : ""}
                      , {o.contact?.city}, {o.contact?.state} {o.contact?.postalCode}, {o.contact?.country}
                    </>
                  )}
                </div>
                {o.notes && (
                  <div className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
                    “{o.notes}”
                  </div>
                )}

                {/* Tracking display */}
                {o.trackingNumber && (
                  <div className="text-xs mt-2 flex items-center gap-2">
                    <span style={{ color: "var(--text-faint)" }}>Tracking:</span>
                    <span
                      className="font-mono font-semibold px-2 py-0.5 rounded"
                      style={{ background: "var(--bg-ghost)", color: "var(--text-primary)" }}
                    >
                      {o.trackingCarrier || "Canada Post"} · {o.trackingNumber}
                    </span>
                  </div>
                )}

                {/* Email status indicators */}
                <div className="flex gap-3 mt-3 text-xs" style={{ color: "var(--text-faint)" }}>
                  {o.paidEmailSentAt && <span>✓ Paid email sent</span>}
                  {o.shippedEmailSentAt && <span>✓ Shipped email sent</span>}
                </div>
              </div>

              {/* Right: totals + controls */}
              <div className="text-right">
                <div className="text-2xl font-bold">{money(o.total)}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Sub {money(o.subtotal)} · Ship {money(o.shipping)}
                </div>
                <div className="mt-3">
                  <OrderAdminControls
                    id={String(o._id)}
                    status={o.status}
                    trackingNumber={o.trackingNumber}
                    trackingCarrier={o.trackingCarrier}
                    shippedEmailSentAt={o.shippedEmailSentAt ? String(o.shippedEmailSentAt) : null}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mt-4 grid md:grid-cols-2 gap-2">
              {o.items.map((it: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm border-t pt-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  {it.image && (
                    <img src={it.image} alt="" className="w-10 h-14 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate">
                      {it.title} <span style={{ color: "var(--text-faint)" }}>({it.platform})</span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {it.conditionCode} · SKU {it.sku} · Qty {it.qty}
                    </div>
                  </div>
                  <div className="font-semibold">{money(it.price * it.qty)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
