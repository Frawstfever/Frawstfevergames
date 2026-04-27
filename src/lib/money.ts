export function money(
  n: number,
  currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || process.env.STORE_CURRENCY || "USD"
) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

/**
 * Format a price in a specific currency (no conversion — pass the final amount).
 * Used by the client-side currency toggle after converting via useCurrency().
 */
export function formatCurrency(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}
