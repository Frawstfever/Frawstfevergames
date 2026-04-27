import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";

type Bucket = "all" | "ready" | "transit" | "delivered" | "pickup" | "cancelled";

function filterFor(bucket: Bucket) {
  switch (bucket) {
    case "ready":
      return { fulfillment: "ship", status: "paid" };
    case "transit":
      return { fulfillment: "ship", status: "shipped" };
    case "delivered":
      return { fulfillment: "ship", status: "completed" };
    case "pickup":
      return { fulfillment: "pickup", status: { $in: ["paid", "ready_pickup"] } };
    case "cancelled":
      return { status: "cancelled" };
    default:
      return {};
  }
}

export async function GET(req: NextRequest) {
  await connectDB();
  const sp = req.nextUrl.searchParams;
  const bucket = (sp.get("bucket") || "all") as Bucket;
  const q = sp.get("q")?.trim() || "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize")) || 50));

  const filter: Record<string, unknown> = { ...filterFor(bucket) };
  if (q) {
    (filter as any).$or = [
      { orderNumber: { $regex: q, $options: "i" } },
      { "contact.name": { $regex: q, $options: "i" } },
      { "contact.email": { $regex: q, $options: "i" } },
      { trackingNumber: { $regex: q, $options: "i" } },
    ];
  }

  // Aggregate counts for each bucket
  const [total, readyCount, transitCount, deliveredCount, pickupCount, cancelledCount, items] = await Promise.all([
    Order.countDocuments(filter),
    Order.countDocuments(filterFor("ready")),
    Order.countDocuments(filterFor("transit")),
    Order.countDocuments(filterFor("delivered")),
    Order.countDocuments(filterFor("pickup")),
    Order.countDocuments(filterFor("cancelled")),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    counts: {
      ready: readyCount,
      transit: transitCount,
      delivered: deliveredCount,
      pickup: pickupCount,
      cancelled: cancelledCount,
    },
  });
}
