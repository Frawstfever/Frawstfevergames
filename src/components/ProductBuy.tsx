"use client";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { money } from "@/lib/money";
import { useRouter } from "next/navigation";

interface Variant {
  _id: string;
  conditionCode: string;
  label: string;
  sku: string;
  price: number;
  stock: number;
  notes?: string;
}

interface BuyProduct {
  _id: string;
  slug: string;
  title: string;
  platform: string;
  coverImage?: string;
  weightGrams: number;
  localPickupAvailable: boolean;
  variants: Variant[];
}

export default function ProductBuy({ product }: { product: BuyProduct }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const inStock = product.variants.filter((v) => v.stock > 0);
  const [variantId, setVariantId] = useState(inStock[0]?._id ?? product.variants[0]?._id ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => product.variants.find((v) => v._id === variantId),
    [variantId, product.variants]
  );

  if (!variant) {
    return (
      <div className="card mt-6 p-4 text-white/70">
        No variants available. Add conditions in the admin panel.
      </div>
    );
  }

  const maxQty = Math.max(1, variant.stock);
  const outOfStock = variant.stock < 1;

  function handleAdd(buyNow = false) {
    if (!variant) return;
    add({
      productId: product._id,
      slug: product.slug,
      variantId: variant._id,
      title: product.title,
      platform: product.platform,
      conditionCode: variant.conditionCode,
      conditionLabel: variant.label,
      sku: variant.sku,
      price: variant.price,
      qty,
      weightGrams: product.weightGrams,
      image: product.coverImage,
      localPickupAvailable: product.localPickupAvailable,
    });
    setAdded(true);
    if (buyNow) router.push("/cart");
  }

  return (
    <div className="mt-6 card p-5">
      <label className="label" htmlFor="variant">
        Condition
      </label>
      <select
        id="variant"
        className="select"
        value={variantId}
        onChange={(e) => {
          setVariantId(e.target.value);
          setQty(1);
          setAdded(false);
        }}
      >
        {product.variants.map((v) => (
          <option key={v._id} value={v._id} disabled={v.stock < 1}>
            {v.label} — {money(v.price)} {v.stock < 1 ? "· SOLD OUT" : `· ${v.stock} in stock`}
          </option>
        ))}
      </select>
      {variant.notes && (
        <p className="mt-2 text-xs text-white/60 italic">Note: {variant.notes}</p>
      )}
      <div className="mt-3 text-xs text-white/60">SKU: {variant.sku}</div>

      <div className="mt-5 flex items-end gap-3">
        <div>
          <label className="label" htmlFor="qty">Qty</label>
          <input
            id="qty"
            type="number"
            min={1}
            max={maxQty}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
            className="input w-20"
            disabled={outOfStock}
          />
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-white/60">Total</div>
          <div className="text-2xl font-bold">{money(variant.price * qty)}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => handleAdd(false)}
          disabled={outOfStock}
          className="btn btn-ghost flex-1 disabled:opacity-40"
        >
          {added ? "Added ✓" : "Add to cart"}
        </button>
        <button
          onClick={() => handleAdd(true)}
          disabled={outOfStock}
          className="btn btn-primary flex-1 disabled:opacity-40"
        >
          Buy now
        </button>
      </div>

      <div className="mt-4 text-xs text-white/60 flex gap-3 flex-wrap">
        <span>🚚 Ships within 5 business days</span>
        {product.localPickupAvailable && <span>📍 Local pickup available</span>}
      </div>
    </div>
  );
}
