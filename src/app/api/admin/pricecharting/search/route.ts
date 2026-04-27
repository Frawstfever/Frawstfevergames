import { NextRequest, NextResponse } from "next/server";
import { pcSearch, centsToUSD } from "@/lib/pricecharting";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  if (!q) return NextResponse.json({ products: [] });
  try {
    const data = await pcSearch(q);
    const products = (data.products || []).map((p) => ({
      id: p.id,
      name: p["product-name"],
      console: p["console-name"],
      loose: centsToUSD(p["loose-price"]),
      cib: centsToUSD(p["cib-price"]),
      new: centsToUSD(p["new-price"]),
      upc: p.upc,
      releaseDate: p["release-date"],
    }));
    return NextResponse.json({ products });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "search failed" },
      { status: 500 }
    );
  }
}
