import { NextRequest, NextResponse } from "next/server";
import { getUsdToCadRate } from "@/lib/forex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("refresh") === "1";
  const r = await getUsdToCadRate(force);
  return NextResponse.json(r);
}
