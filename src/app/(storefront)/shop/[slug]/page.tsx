import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { notFound } from "next/navigation";
import ProductBuy from "@/components/ProductBuy";
import { money } from "@/lib/money";
import { conditionLabel } from "@/lib/conditions";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  await connectDB();
  const doc = await Product.findOne({ slug }).lean();
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-black/30 border border-white/10">
          {product.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.coverImage} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">No cover</div>
          )}
        </div>
        {product.images?.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {product.images.map((src: string, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="aspect-square object-cover rounded-md border border-white/10" />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip">{product.platform}</span>
          {product.releaseYear && <span className="chip">{product.releaseYear}</span>}
          {product.publisher && <span className="chip">{product.publisher}</span>}
          {product.localPickupAvailable && <span className="chip">📍 Pickup OK</span>}
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold glow">{product.title}</h1>

        {product.referencePrice && (
          <div className="mt-2 text-sm text-white/70">
            Market reference:{" "}
            <span className="text-white">{money(product.referencePrice)}</span>
            {product.lastPriceSyncAt && (
              <span className="text-white/50">
                {" "}· synced {new Date(product.lastPriceSyncAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        <ProductBuy
          product={{
            _id: String(product._id),
            slug: product.slug,
            title: product.title,
            platform: product.platform,
            coverImage: product.coverImage,
            weightGrams: product.weightGrams || 180,
            localPickupAvailable: !!product.localPickupAvailable,
            variants: (product.variants || []).map((v: any) => ({
              _id: String(v._id),
              conditionCode: v.conditionCode,
              label: v.label || conditionLabel(v.conditionCode),
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              notes: v.notes,
            })),
          }}
        />

        {product.description && (
          <div className="mt-8">
            <h2 className="font-semibold mb-2">About this game</h2>
            <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
