/**
 * Stallion Express API client
 * Docs: https://stallionexpress.ca/api
 *
 * Base URL: https://api.stallionexpress.ca/api/v4
 */

const BASE = "https://api.stallionexpress.ca/api/v4";

function token() {
  const t = process.env.STALLION_API_TOKEN;
  if (!t) throw new Error("STALLION_API_TOKEN is not set");
  return t;
}

async function stallionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Stallion ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export interface StallionAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  province_code: string;     // e.g. "ON", "BC"
  postal_code: string;       // e.g. "M5V 2T6"
  country_code: string;      // "CA" | "US" | etc.
  phone?: string;
  email?: string;
  is_residential?: boolean;
}

export interface StallionPackage {
  length: number;   // inches (or "unit":"cm")
  width: number;
  height: number;
  weight: number;   // lbs (or "unit":"g")
  weight_unit?: "lbs" | "oz" | "g" | "kg";
  size_unit?: "in" | "cm";
}

export interface StallionRate {
  postage_type: string;
  service: string;
  carrier: string;
  rate: number;              // in CAD
  currency: string;
  delivery_days?: string;
  tracked?: boolean;
}

export interface StallionRateRequest {
  to_address: StallionAddress;
  from_address: StallionAddress;
  weight_unit?: "g" | "kg" | "lbs" | "oz";
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  size_unit?: "in" | "cm";
  value?: number;            // declared value in CAD
  is_signature_required?: boolean;
}

/**
 * Fetch live shipping rates from Stallion.
 * Returns an array of available rates; caller picks cheapest or presents options.
 */
export async function getStallionRates(req: StallionRateRequest): Promise<StallionRate[]> {
  const res = await stallionFetch<{ rates?: StallionRate[] }>("/rates", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return res.rates || [];
}

/** Pick the cheapest tracked rate (or cheapest overall if none are tracked). */
export function pickBestRate(rates: StallionRate[]): StallionRate | null {
  if (rates.length === 0) return null;
  const tracked = rates.filter((r) => r.tracked !== false);
  const pool = tracked.length ? tracked : rates;
  return pool.reduce((a, b) => (a.rate <= b.rate ? a : b));
}
