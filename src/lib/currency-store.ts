"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Store-wide currency for display. Prices in the DB are stored in the store's base
 * currency (CAD for this Canadian store). The toggle lets customers view prices
 * converted to USD. Actual checkout still charges in the base currency.
 */

export type Currency = "CAD" | "USD";

interface CurrencyState {
  display: Currency;      // What the customer wants to see
  baseCurrency: Currency; // What prices are stored in (DB)
  usdToCadRate: number;   // Loaded from /api/forex
  fxAsOf: string;
  fxSource: string;
  setDisplay: (c: Currency) => void;
  setRate: (rate: number, asOf: string, source: string) => void;
  /** Convert a stored price into the currently selected display currency. */
  convert: (amountInBase: number) => number;
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      display: "CAD",
      baseCurrency: "CAD",
      usdToCadRate: 1.38,
      fxAsOf: "",
      fxSource: "",
      setDisplay: (c) => set({ display: c }),
      setRate: (rate, asOf, source) => set({ usdToCadRate: rate, fxAsOf: asOf, fxSource: source }),
      convert: (amountInBase) => {
        const s = get();
        if (s.display === s.baseCurrency) return amountInBase;
        // Base is CAD, display USD → divide by rate
        if (s.baseCurrency === "CAD" && s.display === "USD") {
          return s.usdToCadRate > 0 ? amountInBase / s.usdToCadRate : amountInBase;
        }
        // Base is USD, display CAD → multiply by rate
        if (s.baseCurrency === "USD" && s.display === "CAD") {
          return amountInBase * s.usdToCadRate;
        }
        return amountInBase;
      },
    }),
    { name: "rr-currency" }
  )
);
