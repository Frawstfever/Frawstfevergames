"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  slug: string;
  variantId: string;
  title: string;
  platform: string;
  conditionCode: string;
  conditionLabel: string;
  sku: string;
  price: number;
  qty: number;
  weightGrams: number;
  image?: string;
  localPickupAvailable: boolean;
}

interface CartState {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
  totalWeight: () => number;
  allowsPickup: () => boolean;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, qty: l.qty + line.qty } : l
              ),
            };
          }
          return { lines: [...s.lines, line] };
        }),
      remove: (variantId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),
      setQty: (variantId, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.variantId === variantId ? { ...l, qty: Math.max(0, qty) } : l))
            .filter((l) => l.qty > 0),
        })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((a, l) => a + l.qty, 0),
      subtotal: () => get().lines.reduce((a, l) => a + l.qty * l.price, 0),
      totalWeight: () => get().lines.reduce((a, l) => a + l.qty * l.weightGrams, 0),
      allowsPickup: () => get().lines.every((l) => l.localPickupAvailable),
    }),
    { name: "rr-cart" }
  )
);
