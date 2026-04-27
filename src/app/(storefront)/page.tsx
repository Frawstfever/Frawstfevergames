import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60;

async function getFeatured() {
  try {
    await connectDB();
    const docs = await Product.find({})
      .sort({ featured: -1, updatedAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(docs));
  } catch {
    return [];
  }
}

export default async function Home() {
  const products = await getFeatured();
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="chip">▶ Press Start</span>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-[1.05] glow">
              Pre-owned games,<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#c6ff00] via-[#00e5ff] to-[#ff3da6]">
                every condition.
              </span>
            </h1>
            <p className="mt-4 text-white/80 max-w-prose">
              Pick your copy by condition — sealed, CIB, VG with manual, disc-only,
              whatever fits your budget. Ship anywhere or grab it locally.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/shop" className="btn btn-primary">Shop all games →</Link>
              <Link href="/shop?platform=PS2" className="btn btn-outline">Retro corner</Link>
            </div>
            <div className="mt-6 flex gap-2 flex-wrap">
              <span className="chip">🚚 Flat-rate shipping</span>
              <span className="chip">📍 Local pickup</span>
              <span className="chip">🕹️ Every condition</span>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#160a26] to-[#1f1033] border border-white/10 p-6 relative overflow-hidden scanlines">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,#9b5cff40,transparent_50%),radial-gradient(circle_at_80%_70%,#00e5ff30,transparent_50%)]" />
              <div className="relative grid grid-cols-3 gap-3 h-full">
                {["PS5", "Switch", "N64", "Xbox", "GBA", "PC"].map((p) => (
                  <div
                    key={p}
                    className="rounded-xl border border-white/10 bg-white/5 flex items-center justify-center font-bold"
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-2xl font-bold">Fresh listings</h2>
          <Link href="/shop" className="text-sm nav-link">View all →</Link>
        </div>
        {products.length === 0 ? (
          <div className="card p-8 text-center text-white/70">
            No products yet. Sign in to the <Link href="/admin" className="underline">admin panel</Link> and add your first listing.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
