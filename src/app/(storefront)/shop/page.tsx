import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import ProductCard from "@/components/ProductCard";
import { PLATFORMS } from "@/lib/conditions";

export const dynamic = "force-dynamic";

async function getProducts(search: { q?: string; platform?: string }) {
  try {
    await connectDB();
    const query: Record<string, unknown> = {};
    if (search.platform) query.platform = search.platform;
    if (search.q) query.$text = { $search: search.q };
    const docs = await Product.find(query).sort({ updatedAt: -1 }).limit(60).lean();
    return JSON.parse(JSON.stringify(docs));
  } catch {
    return [];
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string }>;
}) {
  const sp = await searchParams;
  const products = await getProducts(sp);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shop</h1>
          <p className="text-white/70 text-sm">
            {products.length} listings{sp.platform ? ` · ${sp.platform}` : ""}
          </p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Search title…"
            className="input max-w-xs"
          />
          <select name="platform" defaultValue={sp.platform || ""} className="select max-w-[10rem]">
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost">Filter</button>
        </form>
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center text-white/70">
          No matches. <Link href="/shop" className="underline">Clear filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p: any) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
