import Link from "next/link";
import { money } from "@/lib/money";

interface Variant {
  price: number;
  stock: number;
}
interface Product {
  _id: string;
  slug: string;
  title: string;
  platform: string;
  coverImage?: string;
  variants: Variant[];
  featured?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const inStock = variants.filter((v) => (v?.stock || 0) > 0);
  const minPrice = inStock.length ? Math.min(...inStock.map((v) => v.price)) : null;
  const totalStock = variants.reduce((a, v) => a + (v?.stock || 0), 0);

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="card group overflow-hidden hover:border-[#9b5cff]/50 transition"
    >
      <div className="aspect-[3/4] bg-black/40 relative overflow-hidden">
        {product.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.coverImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            No cover
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="chip">{product.platform}</span>
          {product.featured && <span className="chip tag-new">★ Featured</span>}
        </div>
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold tracking-wider text-white">
            SOLD OUT
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold line-clamp-2 min-h-[2.5rem]">{product.title}</div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[#c6ff00] font-bold">
            {minPrice !== null ? `from ${money(minPrice)}` : "—"}
          </span>
          <span className="text-xs text-white/60">{variants.length} options</span>
        </div>
      </div>
    </Link>
  );
}
