import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { slugify, randomSuffix } from "@/lib/slug";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();
  const src = await Product.findById(id).lean();
  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy: any = JSON.parse(JSON.stringify(src));
  delete copy._id;
  delete copy.createdAt;
  delete copy.updatedAt;
  copy.title = `${src.title} (copy)`;

  let base = slugify(`${copy.title}`);
  let slug = `${base}-${randomSuffix()}`;
  while (await Product.exists({ slug })) {
    slug = `${base}-${randomSuffix()}`;
  }
  copy.slug = slug;

  // reset variant _ids and reset stock to 0 so we don't accidentally double-list inventory
  copy.variants = (copy.variants || []).map((v: any) => {
    const { _id, ...rest } = v;
    return { ...rest, stock: 0, sku: `${rest.sku || ""}-${randomSuffix(3)}` };
  });
  copy.featured = false;

  const doc = await Product.create(copy);
  return NextResponse.json({ id: String(doc._id), slug: doc.slug });
}
