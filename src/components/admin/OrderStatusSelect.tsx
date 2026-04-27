"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "paid", "ready_pickup", "shipped", "completed", "cancelled"];

export default function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [val, setVal] = useState(status);
  const [saving, setSaving] = useState(false);

  async function update(next: string) {
    setSaving(true);
    const prev = val;
    setVal(next);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setVal(prev);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="select max-w-[12rem]"
      value={val}
      disabled={saving}
      onChange={(e) => update(e.target.value)}
    >
      {STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );
}
