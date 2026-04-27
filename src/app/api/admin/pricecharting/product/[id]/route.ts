import { NextRequest, NextResponse } from "next/server";
import { pcProductById, centsToUSD } from "@/lib/pricecharting";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const p = await pcProductById(id);
    return NextResponse.json({
      id: p.id,
      name: p["product-name"],
      console: p["console-name"],
      loose: centsToUSD(p["loose-price"]),
      cib: centsToUSD(p["cib-price"]),
      new: centsToUSD(p["new-price"]),
      boxOnly: centsToUSD(p["box-only-price"]),
      manualOnly: centsToUSD(p["manual-only-price"]),
      graded: centsToUSD(p["graded-price"]),
      upc: p.upc,
      releaseDate: p["release-date"],
      genre: p.genre,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "lookup failed" },
      { status: 500 }
    );
  }
}
