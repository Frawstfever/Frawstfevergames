/**
 * USD → CAD exchange rate helpers.
 * Primary source: Bank of Canada Valet API (official, free, no key required).
 * Fallback: Frankfurter API (ECB-based, free, no key).
 * Final fallback: a hardcoded conservative rate.
 */

const FALLBACK_RATE = 1.38;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type CachedRate = { rate: number; source: string; fetchedAt: number; asOf: string };

let _cache: CachedRate | null = null;

async function fromBankOfCanada(): Promise<{ rate: number; asOf: string } | null> {
  try {
    const res = await fetch(
      "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1",
      { cache: "no-store", next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      observations?: Array<{ d: string; FXUSDCAD?: { v: string } }>;
    };
    const obs = json.observations?.[0];
    const v = obs?.FXUSDCAD?.v;
    if (!v || !obs?.d) return null;
    const rate = parseFloat(v);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return { rate, asOf: obs.d };
  } catch {
    return null;
  }
}

async function fromFrankfurter(): Promise<{ rate: number; asOf: string } | null> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=CAD", {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { date?: string; rates?: { CAD?: number } };
    if (typeof json.rates?.CAD !== "number" || !json.date) return null;
    return { rate: json.rates.CAD, asOf: json.date };
  } catch {
    return null;
  }
}

/**
 * Get the current USD → CAD exchange rate, cached for 6 hours.
 * Always returns a usable rate — never throws, falls back to hardcoded value if all sources fail.
 */
export async function getUsdToCadRate(forceRefresh = false): Promise<CachedRate> {
  if (!forceRefresh && _cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
    return _cache;
  }

  // Try Bank of Canada first (most authoritative for CAD)
  const boc = await fromBankOfCanada();
  if (boc) {
    _cache = { rate: boc.rate, source: "Bank of Canada", fetchedAt: Date.now(), asOf: boc.asOf };
    return _cache;
  }

  // Fall back to ECB via Frankfurter
  const frk = await fromFrankfurter();
  if (frk) {
    _cache = { rate: frk.rate, source: "Frankfurter (ECB)", fetchedAt: Date.now(), asOf: frk.asOf };
    return _cache;
  }

  // Both failed — keep existing cache if we have one
  if (_cache) return _cache;

  // Absolute last resort
  const today = new Date().toISOString().slice(0, 10);
  _cache = { rate: FALLBACK_RATE, source: "fallback", fetchedAt: Date.now(), asOf: today };
  return _cache;
}
