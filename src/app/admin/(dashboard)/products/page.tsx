"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { money } from "@/lib/money";
import RowActions from "@/components/admin/RowActions";

type ViewMode = "table" | "card";
const PAGE_SIZES = [25, 50, 100, 200] as const;

export default function ProductsAdmin() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      setProducts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Products ({total})</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title / publisher…"
              className="input max-w-xs"
            />
            <button type="submit" className="btn btn-ghost">Search</button>
          </form>
          <Link href="/admin/products/new" className="btn btn-primary">+ New product</Link>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* View mode toggle */}
        <div className="inline-flex rounded-lg overflow-hidden border border-white/10">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-sm ${viewMode === "table" ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Table
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`px-3 py-1.5 text-sm ${viewMode === "card" ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Cards
          </button>
        </div>

        {/* Page size */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50">Show:</span>
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => handlePageSizeChange(s)}
              className={`px-2 py-1 rounded ${pageSize === s ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-white/50" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Table view */}
      {!loading && viewMode === "table" && (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Platform</th>
                <th>Variants</th>
                <th>Stock</th>
                <th>Min price</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const variants = Array.isArray(p.variants) ? p.variants : [];
                const stock = variants.reduce((a: number, v: any) => a + (v?.stock || 0), 0);
                const inStock = variants.filter((v: any) => (v?.stock || 0) > 0);
                const minPrice = inStock.length ? Math.min(...inStock.map((v: any) => v.price)) : null;
                const img = p.coverImage || (p.images?.length ? p.images[0] : "");
                return (
                  <tr key={p._id}>
                    <td>
                      {img ? (
                        <img src={img} alt="" className="w-10 h-14 object-cover rounded border border-white/10" />
                      ) : (
                        <div className="w-10 h-14 bg-white/5 rounded flex items-center justify-center text-white/20 text-[10px]">
                          No img
                        </div>
                      )}
                    </td>
                    <td>
                      <Link href={`/shop/${p.slug}`} className="hover:underline" target="_blank">
                        {p.title}
                      </Link>
                      <div className="text-xs text-white/40">{p.slug}</div>
                    </td>
                    <td>{p.platform}</td>
                    <td>{variants.length}</td>
                    <td className={stock === 0 ? "text-[#ff3da6]" : ""}>{stock}</td>
                    <td>{minPrice !== null ? money(minPrice) : "—"}</td>
                    <td className="text-right pr-4">
                      <RowActions id={String(p._id)} slug={p.slug} />
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-white/40">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card view */}
      {!loading && viewMode === "card" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.map((p: any) => {
            const variants = Array.isArray(p.variants) ? p.variants : [];
            const stock = variants.reduce((a: number, v: any) => a + (v?.stock || 0), 0);
            const inStock = variants.filter((v: any) => (v?.stock || 0) > 0);
            const minPrice = inStock.length ? Math.min(...inStock.map((v: any) => v.price)) : null;
            const img = p.coverImage || (p.images?.length ? p.images[0] : "");
            return (
              <div key={p._id} className="card group overflow-hidden hover:border-[#9b5cff]/50 transition">
                <div className="aspect-[3/4] bg-black/40 relative overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                      No image
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="chip">{p.platform}</span>
                    {p.featured && <span className="chip tag-new">Featured</span>}
                  </div>
                  {stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold tracking-wider text-sm text-white">
                      SOLD OUT
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="text-sm font-semibold line-clamp-2 min-h-[2.5rem]">{p.title}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#c6ff00] font-bold">
                      {minPrice !== null ? `from ${money(minPrice)}` : "—"}
                    </span>
                    <span className="text-white/50">{variants.length} var · {stock} stock</span>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/products/${p._id}/edit`} className="btn btn-ghost text-xs flex-1 text-center">Edit</Link>
                    <Link href={`/shop/${p.slug}`} target="_blank" className="btn btn-ghost text-xs">View</Link>
                  </div>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-white/40">No products found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-white/50">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="btn btn-ghost text-xs disabled:opacity-30"
            >
              First
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn btn-ghost text-xs disabled:opacity-30"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-sm ${page === p ? "bg-[#9b5cff] text-white" : "btn btn-ghost text-xs"}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="btn btn-ghost text-xs disabled:opacity-30"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="btn btn-ghost text-xs disabled:opacity-30"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
