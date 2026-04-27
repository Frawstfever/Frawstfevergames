import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();
  const orders = await Order.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(orders);
}
