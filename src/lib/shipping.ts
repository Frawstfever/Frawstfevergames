export type ShippingZone = "domestic" | "international" | "pickup";

export interface ShippingQuote {
  zone: ShippingZone;
  weightGrams: number;
  amount: number;
  label: string;
}

// Canadian domestic shipping estimates (CAD) — used as fallback when live rates are unavailable
const DOMESTIC_TABLE: Array<{ maxG: number; price: number }> = [
  { maxG: 250, price: 6 },
  { maxG: 500, price: 9 },
  { maxG: 1000, price: 13 },
  { maxG: 2000, price: 17 },
  { maxG: 5000, price: 26 },
];

export function quoteShipping(
  totalWeightGrams: number,
  country = "CA",
  pickup = false
): ShippingQuote {
  if (pickup) {
    return { zone: "pickup", weightGrams: totalWeightGrams, amount: 0, label: "Local pickup — Free" };
  }
  // We currently ship within Canada only — treat anything else as international est.
  if (country && country.toUpperCase() !== "CA") {
    const kg = Math.max(0.25, totalWeightGrams / 1000);
    const amount = Math.round((18 + kg * 12) * 100) / 100;
    return { zone: "international", weightGrams: totalWeightGrams, amount, label: "International (est.)" };
  }
  const row = DOMESTIC_TABLE.find((r) => totalWeightGrams <= r.maxG);
  if (row) {
    return { zone: "domestic", weightGrams: totalWeightGrams, amount: row.price, label: "Shipping (est.)" };
  }
  const extraKg = Math.ceil((totalWeightGrams - 5000) / 1000);
  return {
    zone: "domestic",
    weightGrams: totalWeightGrams,
    amount: 26 + extraKg * 3,
    label: "Shipping (est., heavy)",
  };
}
