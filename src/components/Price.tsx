"use client";
import { useCurrency } from "@/lib/currency-store";
import { formatCurrency } from "@/lib/money";
import { useEffect, useState } from "react";

interface PriceProps {
  /** Amount in the STORE's base currency (CAD by default). */
  amount: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a price converted to the currently selected display currency.
 * Until mounted, falls back to the base-currency formatter to avoid hydration mismatch.
 */
export default function Price({ amount, className, style }: PriceProps) {
  const [mounted, setMounted] = useState(false);
  const display = useCurrency((s) => s.display);
  const baseCurrency = useCurrency((s) => s.baseCurrency);
  const convert = useCurrency((s) => s.convert);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className={className} style={style}>{formatCurrency(amount, baseCurrency)}</span>;
  }

  return (
    <span className={className} style={style}>
      {formatCurrency(convert(amount), display)}
    </span>
  );
}
