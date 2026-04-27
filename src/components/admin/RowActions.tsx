"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function RowActions({ id }: { id: string; slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "dup" | "del">(null);

  async function duplicate() {
    setBusy("dup");
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/admin/products/${data.id}/edit`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this product? This can't be undone.")) return;
    setBusy("del");
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex gap-1">
      <Link href={`/admin/products/${id}/edit`} className="btn btn-ghost text-xs">Edit</Link>
      <button onClick={duplicate} disabled={!!busy} className="btn btn-ghost text-xs">
        {busy === "dup" ? "…" : "Duplicate"}
      </button>
      <button onClick={remove} disabled={!!busy} className="btn btn-ghost text-xs text-[#ff6b9a]">
        {busy === "del" ? "…" : "Delete"}
      </button>
    </div>
  );
}
