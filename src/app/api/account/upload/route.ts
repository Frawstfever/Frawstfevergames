import { NextRequest, NextResponse } from "next/server";
import { uploadFromBase64 } from "@/lib/cloudinary";
import { getCustomerSession } from "@/lib/customer-auth";

/**
 * POST /api/account/upload
 * Authenticated user upload (customer or admin). Used for avatars and similar.
 * Accepts: { file: "data:image/...;base64,..." }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const imageUrl = await uploadFromBase64(body.file, "avatars");
    return NextResponse.json({ url: imageUrl });
  } catch (e: unknown) {
    console.error("[Account Upload]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
