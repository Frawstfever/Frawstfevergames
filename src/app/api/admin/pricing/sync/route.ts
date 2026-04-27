import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { parseCSV } from "@/lib/csv";

/**
 * POST /api/admin/pricing/sync
 * Body: { url?: string, csv?: string, mode?: "update_price" | "update_stock" | "update_reference" | "update_all" }
 *
 * Accepts a published Google-Sheet CSV (File > Share > Publish to web > CSV)
 * or raw CSV text. Expected columns (case-insensitive):
 *   sku, price, stock, reference_price
 *
 * - Matches each row to a variant by SKU and updates the chosen fields.
 * - If a row has no SKU but has a product slug, updates the product-level referencePrice.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || "update_all";
    let csvText: string | undefined = body.csv;

    if (!csvText) {
      const url: string = body.url || process.env.PRICE_SHEET_CSV_URL || "";
      if (!url) return NextResponse.json({ error: "No CSV url or data provided" }, { status: 400 });
      const resp = await fetch(url, { cache: "no-store" });
      if (!resp.ok)
        return NextResponse.json({ error: `Fetch failed: ${resp.status}` }, { status: 400 });
      csvText = await resp.text();
    }

    const rows = parseCSV(csvText || "");
    if (rows.length === 0) return NextResponse.json({ error: "CSV is empty" }, { status: 400 });

    await connectDB();
    const report = {
      rows: rows.length,
      variantsMatched: 0,
      variantsUpdated: 0,
      productsUpdated: 0,
      misses: [] as string[],
    };

    for (const r of rows) {
      const sku = (r.sku || "").trim();
      const slug = (r.slug || "").trim();
      const price = r.price ? Number(r.price) : undefined;
      const stock = r.stock ? Number(r.stock) : undefined;
      const reference = r.reference_price ? Number(r.reference_price) : undefined;

      if (sku) {
        const product = await Product.findOne({ "variants.sku": sku });
        if (!product) {
          report.misses.push(sku);
          continue;
        }
        report.variantsMatched++;
        const variant = product.variants.find((v) => v.sku === sku);
        if (!variant) continue;
        let touched = false;
        if (price !== undefined && !Number.isNaN(price) && (mode === "update_price" || mode === "update_all")) {
          variant.price = price;
          touched = true;
        }
        if (
          stock !== undefined &&
          !Number.isNaN(stock) &&
          (mode === "update_stock" || mode === "update_all")
        ) {
          variant.stock = Math.max(0, Math.floor(stock));
          touched = true;
        }
        if (
          reference !== undefined &&
          !Number.isNaN(reference) &&
          (mode === "update_reference" || mode === "update_all")
        ) {
          product.referencePrice = reference;
          product.lastPriceSyncAt = new Date();
          touched = true;
        }
        if (touched) {
          if (price !== undefined || stock !== undefined) product.lastPriceSyncAt = new Date();
          await product.save();
          report.variantsUpdated++;
        }
      } else if (slug && reference !== undefined) {
        const res = await Product.updateOne(
          { slug },
          { $set: { referencePrice: reference, lastPriceSyncAt: new Date() } }
        );
        if (res.modifiedCount > 0) report.productsUpdated++;
        else report.misses.push(`slug:${slug}`);
      }
    }

    return NextResponse.json(report);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
