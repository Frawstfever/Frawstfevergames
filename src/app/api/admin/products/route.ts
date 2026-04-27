import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { slugify, randomSuffix } from "@/lib/slug";

export async function GET(req: NextRequest) {
  await connectDB();
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") || "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize")) || 25));

  const filter: Record<string, unknown> = q ? { $text: { $search: q } } : {};
  const total = await Product.countDocuments(filter);
  const totalPages = Math.ceil(total / pageSize);
  const items = await Product.find(filter)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return NextResponse.json({ items, total, page, pageSize, totalPages });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  await connectDB();

  let slug = body.slug || slugify(`${body.title}-${body.platform}`);
  while (await Product.exists({ slug })) {
    slug = `${slugify(body.title)}-${randomSuffix()}`;
  }

  const doc = await Product.create({
    ...body,
    slug,
  });
  return NextResponse.json({ id: String(doc._id), slug: doc.slug });
}
