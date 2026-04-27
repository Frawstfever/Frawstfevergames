import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await connectDB();
  const items = await ContactMessage.find({ email: session.email.toLowerCase().trim() })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ items });
}
