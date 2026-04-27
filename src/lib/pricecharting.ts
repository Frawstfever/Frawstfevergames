/**
 * PriceCharting API client
 * Docs: https://www.pricecharting.com/api-documentation
 *
 * All prices in PriceCharting responses are integers in cents.
 */

const BASE = "https://www.pricecharting.com/api";

function token() {
  const t = process.env.PRICECHARTING_TOKEN;
  if (!t) throw new Error("PRICECHARTING_TOKEN is not set");
  return t;
}

export interface PCProduct {
  id: string;
  "product-name": string;
  "console-name": string;
  "loose-price"?: number;
  "cib-price"?: number;
  "new-price"?: number;
  "box-only-price"?: number;
  "manual-only-price"?: number;
  "graded-price"?: number;
  "box-8-price"?: number;
  "box-9-price"?: number;
  "upc"?: string;
  "release-date"?: string;
  "genre"?: string;
  "asin"?: string;
  status?: string;
  "error-message"?: string;
}

async function pc<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ t: token(), ...params }).toString();
  const res = await fetch(`${BASE}${path}?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`PriceCharting ${res.status}`);
  const json = (await res.json()) as T & { status?: string; "error-message"?: string };
  if (json.status && json.status !== "success") {
    throw new Error(json["error-message"] || `PriceCharting error: ${json.status}`);
  }
  return json as T;
}

export async function pcProductById(id: string): Promise<PCProduct> {
  return pc<PCProduct>("/product", { id });
}

export async function pcProductByUPC(upc: string): Promise<PCProduct> {
  return pc<PCProduct>("/product", { upc });
}

export async function pcSearch(q: string): Promise<{ products: PCProduct[] }> {
  return pc<{ products: PCProduct[] }>("/products", { q });
}

export async function pcDownloadCustomCSV(): Promise<string> {
  const url =
    process.env.PRICECHARTING_CUSTOM_CSV_URL ||
    `https://www.pricecharting.com/price-guide/download-custom?t=${token()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`PriceCharting CSV ${res.status}`);
  return await res.text();
}

/** Pick a reasonable "reference price" for a product overall (for display). */
export function pickReferenceCents(p: PCProduct): number | undefined {
  return p["loose-price"] ?? p["cib-price"] ?? p["new-price"];
}

/** Map one of our condition codes to the best PriceCharting price (in cents). */
export function priceForCondition(p: PCProduct, conditionCode: string): number | undefined {
  switch (conditionCode) {
    case "NEW":
      return p["new-price"];
    case "LN":
      // Like New — usually priced near CIB; fall back to new-price
      return p["cib-price"] ?? p["new-price"];
    case "CIB":
    case "VG_CM":
      return p["cib-price"];
    case "VG_NM":
    case "G":
    case "WU":
    case "DO":
      return p["loose-price"];
    case "BOX":
      return p["box-only-price"];
    case "MAN":
      return p["manual-only-price"];
    default:
      return p["loose-price"] ?? p["cib-price"];
  }
}

export const centsToUSD = (cents?: number) =>
  typeof cents === "number" && cents > 0 ? Math.round(cents) / 100 : undefined;

/**
 * Scrape the cover image from a PriceCharting product page,
 * then upload it to Cloudinary for permanent hosting.
 * Returns the Cloudinary URL, or empty string if not found.
 */
export async function pcFetchCoverImage(pcId: string): Promise<string> {
  try {
    const url = `https://www.pricecharting.com/game/${pcId}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) {
      console.warn(`[pcFetchCoverImage] HTTP ${res.status} for ${pcId}`);
      return "";
    }
    const html = await res.text();

    let sourceUrl = "";

    // 1) Primary: the <div class="cover"> → <img src="..."> pattern (PriceCharting's actual HTML)
    //    Images are hosted at storage.googleapis.com/images.pricecharting.com/...
    const coverMatch = html.match(/<div\s+class=["']cover["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    if (coverMatch?.[1]) {
      sourceUrl = coverMatch[1].trim();
    }

    // 2) Fallback: any image hosted on images.pricecharting.com
    if (!sourceUrl) {
      const imgMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']*images\.pricecharting\.com\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
      if (imgMatch?.[1]) sourceUrl = imgMatch[1].trim();
    }

    // 3) Fallback: og:image meta tag (if PriceCharting adds it in future)
    if (!sourceUrl) {
      const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
        || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      if (ogMatch?.[1]) {
        const imgUrl = ogMatch[1].trim();
        if (imgUrl && !imgUrl.includes("placeholder") && !imgUrl.includes("no-image")) {
          sourceUrl = imgUrl;
        }
      }
    }

    if (!sourceUrl) {
      console.warn(`[pcFetchCoverImage] No image found in HTML for ${pcId}`);
      return "";
    }

    // Normalize protocol-relative URLs
    if (sourceUrl.startsWith("//")) sourceUrl = "https:" + sourceUrl;

    // Upgrade to the higher-resolution version when possible
    // PriceCharting serves 240.jpg thumbnails by default, and 1600.jpg is the full-res version.
    const hiRes = sourceUrl.replace(/\/240(\.(jpg|jpeg|png|webp))$/i, "/1600$1");
    if (hiRes !== sourceUrl) {
      try {
        const check = await fetch(hiRes, { method: "HEAD" });
        if (check.ok) sourceUrl = hiRes;
      } catch { /* fall back to 240.jpg */ }
    }

    // Upload to Cloudinary
    try {
      const { uploadFromUrl } = await import("@/lib/cloudinary");
      const cloudUrl = await uploadFromUrl(sourceUrl, "products");
      console.log(`[pcFetchCoverImage] Uploaded ${pcId} → ${cloudUrl}`);
      return cloudUrl;
    } catch (e) {
      console.error(`[pcFetchCoverImage] Cloudinary upload failed for ${pcId}:`, e);
      return sourceUrl;
    }
  } catch (e) {
    console.error(`[pcFetchCoverImage] Error for ${pcId}:`, e);
    return "";
  }
}

/** PriceCharting "console-name" → our PLATFORMS value. Falls back to "Other". */
export function mapConsoleToPlatform(consoleName: string | undefined): string {
  const c = (consoleName || "").toLowerCase();
  const table: Array<[RegExp, string]> = [
    [/playstation 5|ps5/, "PS5"],
    [/playstation 4|ps4/, "PS4"],
    [/playstation 3|ps3/, "PS3"],
    [/playstation 2|ps2/, "PS2"],
    [/playstation$|\bps1\b|ps one|playstation 1/, "PS1"],
    [/xbox series/, "Xbox Series"],
    [/xbox one/, "Xbox One"],
    [/xbox 360/, "Xbox 360"],
    [/\bxbox\b/, "Xbox"],
    [/nintendo switch|switch/, "Switch"],
    [/wii u/, "Wii U"],
    [/\bwii\b/, "Wii"],
    [/gamecube/, "GameCube"],
    [/nintendo 64|\bn64\b/, "N64"],
    [/super nintendo|snes/, "SNES"],
    [/^nes$|nintendo entertainment system/, "NES"],
    [/gba|game boy advance/, "GBA"],
    [/nintendo 3ds|3ds/, "3DS"],
    [/nintendo ds/, "DS"],
    [/\bpc\b|windows/, "PC"],
  ];
  for (const [re, platform] of table) if (re.test(c)) return platform;
  return "Other";
}

/** Parse a number that could be "12.99", "$12.99", "1299" (cents), or "". */
export function parseFlexPrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  // Heuristic: if the value is an integer with no decimal and >= 1000, treat as cents.
  if (!cleaned.includes(".") && Number.isInteger(n) && n >= 1000) return n / 100;
  return Math.round(n * 100) / 100;
}
