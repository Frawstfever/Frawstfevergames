import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  await connectDB();
  const msg = await ContactMessage.findById(id);
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.read !== undefined) msg.read = !!body.read;
  await msg.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();
  const r = await ContactMessage.findByIdAndDelete(id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
