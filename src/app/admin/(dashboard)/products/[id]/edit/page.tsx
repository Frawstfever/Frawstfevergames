import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import ProductForm, { ProductFormValue } from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const doc = await Product.findById(id).lean();
  if (!doc) notFound();
  const p: any = JSON.parse(JSON.stringify(doc));

  const initial: ProductFormValue = {
    _id: String(p._id),
    slug: p.slug,
    title: p.title,
    platform: p.platform,
    genre: p.genre || [],
    releaseYear: p.releaseYear,
    publisher: p.publisher,
    coverImage: p.coverImage || "",
    images: p.images || [],
    description: p.description || "",
    variants: (p.variants || []).map((v: any) => ({
      _id: String(v._id),
      conditionCode: v.conditionCode,
      label: v.label,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      notes: v.notes,
      hasManual: v.hasManual,
      hasBox: v.hasBox,
      hasDisc: v.hasDisc,
    })),
    weightGrams: p.weightGrams || 180,
    localPickupAvailable: !!p.localPickupAvailable,
    externalPriceUrl: p.externalPriceUrl,
    priceChartingId: p.priceChartingId,
    pcLoose: p.pcLoose,
    pcCIB: p.pcCIB,
    pcNew: p.pcNew,
    referencePrice: p.referencePrice,
    featured: !!p.featured,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit — {p.title}</h1>
      <ProductForm initial={initial} />
    </div>
  );
}
