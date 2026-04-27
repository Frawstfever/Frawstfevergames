"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONDITIONS, PLATFORMS } from "@/lib/conditions";
import { money } from "@/lib/money";
import PriceChartingPicker from "./PriceChartingPicker";
import ImageManager from "./ImageManager";

type Variant = {
  _id?: string;
  conditionCode: string;
  label?: string;
  sku: string;
  price: number;
  stock: number;
  notes?: string;
  hasManual?: boolean;
  hasBox?: boolean;
  hasDisc?: boolean;
};

export interface ProductFormValue {
  _id?: string;
  slug?: string;
  title: string;
  platform: string;
  genre: string[];
  releaseYear?: number;
  publisher?: string;
  coverImage: string;
  images: string[];
  description: string;
  variants: Variant[];
  weightGrams: number;
  localPickupAvailable: boolean;
  externalPriceUrl?: string;
  priceChartingId?: string;
  pcLoose?: number;
  pcCIB?: number;
  pcNew?: number;
  referencePrice?: number;
  featured?: boolean;
}

const EMPTY: ProductFormValue = {
  title: "",
  platform: "PS4",
  genre: [],
  coverImage: "",
  images: [],
  description: "",
  variants: [
    { conditionCode: "NEW", sku: "", price: 25, stock: 0, hasManual: true, hasBox: true, hasDisc: true },
    { conditionCode: "CIB", sku: "", price: 15, stock: 0, hasManual: true, hasBox: true, hasDisc: true },
    { conditionCode: "DO",  sku: "", price: 10, stock: 0, hasManual: false, hasBox: false, hasDisc: true, notes: "Disc/cart only (loose)" },
  ],
  weightGrams: 180,
  localPickupAvailable: true,
  featured: false,
};

export default function ProductForm({ initial }: { initial?: ProductFormValue }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValue>(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function setField<K extends keyof ProductFormValue>(k: K, val: ProductFormValue[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  function addVariant() {
    setV((s) => ({
      ...s,
      variants: [
        ...s.variants,
        { conditionCode: "VG_NM", sku: "", price: 10, stock: 1, hasDisc: true },
      ],
    }));
  }

  function updateVariant(i: number, patch: Partial<Variant>) {
    setV((s) => ({
      ...s,
      variants: s.variants.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    }));
  }

  function removeVariant(i: number) {
    setV((s) => ({ ...s, variants: s.variants.filter((_, idx) => idx !== i) }));
  }

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const url = v._id ? `/api/admin/products/${v._id}` : "/api/admin/products";
      const method = v._id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/admin/products");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const totalStock = v.variants.reduce((a, x) => a + Number(x.stock || 0), 0);
  const inventoryValue = v.variants.reduce((a, x) => a + Number(x.price || 0) * Number(x.stock || 0), 0);

  return (
    <div className="space-y-6">
      <section className="card p-5 grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Title</label>
          <input
            className="input"
            value={v.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="e.g. Grand Theft Auto V"
          />
        </div>
        <div>
          <label className="label">Platform</label>
          <select
            className="select"
            value={v.platform}
            onChange={(e) => setField("platform", e.target.value)}
          >
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Release year</label>
          <input
            type="number"
            className="input"
            value={v.releaseYear || ""}
            onChange={(e) => setField("releaseYear", Number(e.target.value) || undefined)}
          />
        </div>
        <div>
          <label className="label">Publisher</label>
          <input
            className="input"
            value={v.publisher || ""}
            onChange={(e) => setField("publisher", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Genre (comma separated)</label>
          <input
            className="input"
            value={v.genre.join(", ")}
            onChange={(e) =>
              setField(
                "genre",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        </div>
        <div className="md:col-span-2">
          <ImageManager
            coverImage={v.coverImage}
            images={v.images}
            onChange={(next) => setV((s) => ({ ...s, coverImage: next.coverImage, images: next.images }))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            rows={4}
            value={v.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Weight (grams, for shipping)</label>
          <input
            type="number"
            className="input"
            value={v.weightGrams}
            onChange={(e) => setField("weightGrams", Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">Reference / market price (optional)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={v.referencePrice ?? ""}
            onChange={(e) => setField("referencePrice", Number(e.target.value) || undefined)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">External price source URL (for sync)</label>
          <input
            className="input"
            value={v.externalPriceUrl || ""}
            onChange={(e) => setField("externalPriceUrl", e.target.value)}
            placeholder="Published Google Sheet CSV URL (optional, per-product)"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={v.localPickupAvailable}
            onChange={(e) => setField("localPickupAvailable", e.target.checked)}
          />
          Allow local pickup
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!v.featured}
            onChange={(e) => setField("featured", e.target.checked)}
          />
          Feature on homepage
        </label>
      </section>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">PriceCharting link</h2>
          {v.priceChartingId && (
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={async () => {
                try {
                  const res = await fetch(
                    `/api/admin/pricecharting/product/${encodeURIComponent(v.priceChartingId!)}`
                  );
                  const d = await res.json();
                  if (!res.ok) throw new Error(d.error || "Lookup failed");
                  setV((s) => ({
                    ...s,
                    pcLoose: d.loose,
                    pcCIB: d.cib,
                    pcNew: d.new,
                    referencePrice: d.loose ?? d.cib ?? d.new ?? s.referencePrice,
                  }));
                } catch (e: unknown) {
                  alert(e instanceof Error ? e.message : "Failed");
                }
              }}
            >
              Refresh PC prices
            </button>
          )}
        </div>
        <PriceChartingPicker
          value={v.priceChartingId}
          onPick={(hit) =>
            setV((s) => ({
              ...s,
              priceChartingId: hit.id,
              title: s.title || hit.name,
              pcLoose: hit.loose,
              pcCIB: hit.cib,
              pcNew: hit.new,
              referencePrice: hit.loose ?? hit.cib ?? hit.new ?? s.referencePrice,
            }))
          }
        />
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="card p-3">
            <div className="text-xs text-white/60">Loose</div>
            <div className="font-bold">
              {v.pcLoose !== undefined ? money(v.pcLoose) : "—"}
            </div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-white/60">CIB</div>
            <div className="font-bold">
              {v.pcCIB !== undefined ? money(v.pcCIB) : "—"}
            </div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-white/60">New</div>
            <div className="font-bold">
              {v.pcNew !== undefined ? money(v.pcNew) : "—"}
            </div>
          </div>
        </div>
        {v.priceChartingId && (
          <button
            type="button"
            className="btn btn-ghost text-xs text-[#ff6b9a]"
            onClick={() =>
              setV((s) => ({
                ...s,
                priceChartingId: undefined,
                pcLoose: undefined,
                pcCIB: undefined,
                pcNew: undefined,
              }))
            }
          >
            Unlink PriceCharting ID
          </button>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Condition variants</h2>
          <button type="button" onClick={addVariant} className="btn btn-ghost text-xs">
            + Add condition
          </button>
        </div>
        <div className="space-y-3">
          {v.variants.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 md:col-span-3">
                <label className="label">Condition</label>
                <select
                  className="select"
                  value={row.conditionCode}
                  onChange={(e) => updateVariant(i, { conditionCode: e.target.value })}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="label">SKU</label>
                <input
                  className="input"
                  value={row.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  placeholder="GTA5-PS4-VGCM-001"
                />
              </div>
              <div className="col-span-3 md:col-span-2">
                <label className="label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={row.price}
                  onChange={(e) => updateVariant(i, { price: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="label">Stock</label>
                <input
                  type="number"
                  className="input"
                  value={row.stock}
                  onChange={(e) => updateVariant(i, { stock: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-12 md:col-span-3 flex gap-3 text-xs items-center">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={!!row.hasBox}
                    onChange={(e) => updateVariant(i, { hasBox: e.target.checked })}
                  />
                  Box
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={!!row.hasManual}
                    onChange={(e) => updateVariant(i, { hasManual: e.target.checked })}
                  />
                  Manual
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={!!row.hasDisc}
                    onChange={(e) => updateVariant(i, { hasDisc: e.target.checked })}
                  />
                  Disc/Cart
                </label>
                <button
                  type="button"
                  className="ml-auto text-[#ff6b9a]"
                  onClick={() => removeVariant(i)}
                >
                  Remove
                </button>
              </div>
              <div className="col-span-12">
                <label className="label">Notes (shown to buyer)</label>
                <input
                  className="input"
                  value={row.notes || ""}
                  onChange={(e) => updateVariant(i, { notes: e.target.value })}
                  placeholder="e.g. Light shelf wear; manual has small tear"
                />
              </div>
              <div className="col-span-12 h-px bg-white/10" />
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-white/60 flex gap-4">
          <span>Total units: {totalStock}</span>
          <span>Inventory value: {money(inventoryValue)}</span>
        </div>
      </section>

      {err && <div className="text-[#ff3da6] text-sm">{err}</div>}

      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : v._id ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  );
}
