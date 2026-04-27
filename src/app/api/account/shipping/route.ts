import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getCustomerSession } from "@/lib/customer-auth";

type Bucket = "all" | "pending" | "transit" | "delivered" | "pickup" | "cancelled";

function filterFor(bucket: Bucket, userId: string) {
  const base = { userId };
  switch (bucket) {
    case "pending":
      return { ...base, fulfillment: "ship", status: "paid" };
    case "transit":
      return { ...base, fulfillment: "ship", status: "shipped" };
    case "delivered":
      return { ...base, status: "completed" };
    case "pickup":
      return { ...base, fulfillment: "pickup", status: { $in: ["paid", "ready_pickup"] } };
    case "cancelled":
      return { ...base, status: "cancelled" };
    default:
      return base;
  }
}

export async function GET(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const bucket = (req.nextUrl.searchParams.get("bucket") || "all") as Bucket;
  await connectDB();

  const [items, pending, transit, delivered, pickup, cancelled] = await Promise.all([
    Order.find(filterFor(bucket, session.userId)).sort({ createdAt: -1 }).lean(),
    Order.countDocuments(filterFor("pending", session.userId)),
    Order.countDocuments(filterFor("transit", session.userId)),
    Order.countDocuments(filterFor("delivered", session.userId)),
    Order.countDocuments(filterFor("pickup", session.userId)),
    Order.countDocuments(filterFor("cancelled", session.userId)),
  ]);

  return NextResponse.json({
    items,
    counts: { pending, transit, delivered, pickup, cancelled },
  });
}
