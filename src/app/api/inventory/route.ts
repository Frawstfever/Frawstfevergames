import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AUTH_KEY = process.env.INVENTORY_API_KEY;

export async function GET(req: Request) {
  // shared-secret auth
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-api-key");
  if (!AUTH_KEY || key !== AUTH_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectDB();
  const docs = await Product.find(
    {},
    "title platform slug variants priceChartingId"
  ).lean();

  const products = docs.map((d: any) => {
    const variants = Array.isArray(d.variants) ? d.variants : [];
    const stock = variants.reduce(
      (n: number, v: any) => n + (Number(v.stock) || 0),
      0
    );
    const inStockPrices = variants
      .filter(
        (v: any) => (Number(v.stock) || 0) > 0 && typeof v.price === "number"
      )
      .map((v: any) => Number(v.price));
    const min_price_cad = inStockPrices.length
      ? Math.min(...inStockPrices)
      : null;
    return {
      title: d.title,
      platform: d.platform,
      pricecharting_id: d.priceChartingId ? String(d.priceChartingId) : null,
      stock,
      min_price_cad,
      url: d.slug
        ? `https://www.frawstfevergames.ca/shop/${d.slug}`
        : null,
    };
  });

  return NextResponse.json({
    updated_at: new Date().toISOString(),
    total: products.length,
    products,
  });
}
