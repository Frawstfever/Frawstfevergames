import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCustomerSession } from "@/lib/customer-auth";
import bcrypt from "bcryptjs";

/** GET — return full profile */
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId)
    .select("-passwordHash -verifyToken -verifyTokenExpires -resetToken -resetTokenExpires")
    .lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

/** PATCH — update profile */
export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  await connectDB();

  const user = await User.findById(session.userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (body.name !== undefined) user.name = body.name;
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.address !== undefined) user.address = body.address;
  if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl;

  // Password change requires current password
  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    user.passwordHash = await bcrypt.hash(body.newPassword, 12);
  }

  await user.save();
  return NextResponse.json({ ok: true });
}
