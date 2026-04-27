"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "paid", "ready_pickup", "shipped", "completed", "cancelled"];
const CARRIERS = ["Canada Post", "UPS", "Purolator", "FedEx", "Stallion Express", "Other"];

interface Props {
  id: string;
  status: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  shippedEmailSentAt?: string | null;
}

export default function OrderAdminControls({ id, status, trackingNumber, trackingCarrier, shippedEmailSentAt }: Props) {
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState(status);
  const [localNumber, setLocalNumber] = useState(trackingNumber || "");
  const [localCarrier, setLocalCarrier] = useState(trackingCarrier || "Canada Post");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function patch(payload: Record<string, unknown>) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      router.refresh();
      return true;
    } catch (e: unknown) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(next: string) {
    const prev = localStatus;
    setLocalStatus(next);
    const ok = await patch({ status: next });
    if (!ok) setLocalStatus(prev);
    else if (next === "shipped") setMsg({ type: "ok", text: "Status updated — shipping email sent." });
    else setMsg({ type: "ok", text: "Status updated." });
    setTimeout(() => setMsg(null), 2500);
  }

  async function saveTracking() {
    const ok = await patch({
      trackingNumber: localNumber.trim(),
      trackingCarrier: localCarrier,
    });
    if (ok) setMsg({ type: "ok", text: "Tracking saved." });
    setTimeout(() => setMsg(null), 2500);
  }

  async function saveAndShip() {
    if (!localNumber.trim()) {
      setMsg({ type: "err", text: "Enter a tracking number first." });
      return;
    }
    setLocalStatus("shipped");
    const ok = await patch({
      status: "shipped",
      trackingNumber: localNumber.trim(),
      trackingCarrier: localCarrier,
    });
    if (ok) setMsg({ type: "ok", text: "Tracking saved and shipping email sent." });
    setTimeout(() => setMsg(null), 2500);
  }

  const shippedEmailLabel = shippedEmailSentAt
    ? `Email sent ${new Date(shippedEmailSentAt).toLocaleDateString()}`
    : null;

  return (
    <div className="space-y-2 min-w-[18rem]">
      {/* Status */}
      <select
        className="select"
        value={localStatus}
        disabled={saving}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>

      {/* Tracking inputs — show when status is paid/shipped/completed */}
      {["paid", "shipped", "completed"].includes(localStatus) && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex gap-2">
            <select
              className="select flex-shrink-0"
              style={{ width: "10rem" }}
              value={localCarrier}
              onChange={(e) => setLocalCarrier(e.target.value)}
              disabled={saving}
            >
              {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className="input flex-1"
              placeholder="Tracking number"
              value={localNumber}
              onChange={(e) => setLocalNumber(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveTracking}
              disabled={saving}
              className="btn btn-ghost text-xs flex-1"
            >
              Save tracking
            </button>
            {localStatus !== "shipped" && (
              <button
                type="button"
                onClick={saveAndShip}
                disabled={saving || !localNumber.trim()}
                className="btn btn-primary text-xs flex-1"
              >
                Save & mark shipped
              </button>
            )}
          </div>
          {shippedEmailLabel && (
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>
              ✓ {shippedEmailLabel}
            </div>
          )}
        </div>
      )}

      {msg && (
        <div className="text-xs" style={{ color: msg.type === "ok" ? "var(--ok)" : "var(--danger)" }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
