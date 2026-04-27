import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

export async function GET(req: NextRequest) {
  await connectDB();
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize")) || 25));
  const filter: Record<string, unknown> = {};
  if (sp.get("unread") === "1") filter.read = false;

  const total = await ContactMessage.countDocuments(filter);
  const unread = await ContactMessage.countDocuments({ read: false });
  const totalPages = Math.ceil(total / pageSize);
  const items = await ContactMessage.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return NextResponse.json({ items, total, unread, page, pageSize, totalPages });
}
