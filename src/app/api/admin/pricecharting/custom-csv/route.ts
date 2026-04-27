import { NextResponse } from "next/server";
import { pcDownloadCustomCSV } from "@/lib/pricecharting";

/**
 * Proxies your custom PriceCharting price guide CSV download.
 * Keeps the token server-side — the browser never sees it.
 */
export async function GET() {
  try {
    const text = await pcDownloadCustomCSV();
    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pricecharting-custom-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "download failed" },
      { status: 500 }
    );
  }
}
