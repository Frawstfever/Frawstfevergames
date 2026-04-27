import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { sendOrderShippedEmail } from "@/lib/resend";

const ALLOWED = new Set(["pending", "paid", "ready_pickup", "shipped", "completed", "cancelled"]);

function trackingUrlFor(carrier: string | undefined, number: string | undefined): string | undefined {
  if (!number) return undefined;
  const c = (carrier || "").toLowerCase();
  if (c.includes("canada post")) return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(number)}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`;
  if (c.includes("purolator")) return `https://www.purolator.com/en/shipping/tracker?pin=${encodeURIComponent(number)}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`;
  if (c.includes("stallion")) return `https://stallionexpress.ca/track/${encodeURIComponent(number)}`;
  return undefined;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, notes, trackingNumber, trackingCarrier } = body;

  if (status && !ALLOWED.has(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  await connectDB();
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStatus = order.status;
  if (status) order.status = status;
  if (typeof notes === "string") order.notes = notes;
  if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber).trim();
  if (trackingCarrier !== undefined) order.trackingCarrier = String(trackingCarrier).trim();

  await order.save();

  // Send "shipped" email once when status transitions to "shipped"
  const transitioned = status === "shipped" && prevStatus !== "shipped";
  if (transitioned && !order.shippedEmailSentAt) {
    try {
      await sendOrderShippedEmail({
        orderNumber: order.orderNumber,
        customerName: order.contact.name,
        customerEmail: order.contact.email,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        currency: process.env.STORE_CURRENCY || "CAD",
        fulfillment: order.fulfillment,
        trackingNumber: order.trackingNumber,
        trackingCarrier: order.trackingCarrier,
        trackingUrl: trackingUrlFor(order.trackingCarrier, order.trackingNumber),
      });
      order.shippedEmailSentAt = new Date();
      await order.save();
    } catch (e) {
      console.error(`[Admin Orders] Failed to send shipped email for ${order.orderNumber}:`, e);
    }
  }

  return NextResponse.json({
    ok: true,
    status: order.status,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
  });
}
