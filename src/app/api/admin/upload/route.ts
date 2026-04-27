import { NextRequest, NextResponse } from "next/server";
import { uploadFromBase64, uploadFromUrl } from "@/lib/cloudinary";

/**
 * POST /api/admin/upload
 * Upload an image to Cloudinary.
 * Accepts either:
 *   - { url: "https://..." } — upload from URL
 *   - { file: "data:image/...;base64,..." } — upload from base64
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let imageUrl: string;

    if (body.url) {
      imageUrl = await uploadFromUrl(body.url, "products");
    } else if (body.file) {
      imageUrl = await uploadFromBase64(body.file, "products");
    } else {
      return NextResponse.json({ error: "Provide url or file (base64)" }, { status: 400 });
    }

    return NextResponse.json({ url: imageUrl });
  } catch (e: unknown) {
    console.error("[Upload]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
