import AdminNav from "@/components/admin/AdminNav";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left sidebar */}
      <AdminNav />

      {/* Main content — shifted right to make room for the left sidebar */}
      <main className="flex-1 ml-64 min-w-0">
        {/* Admin top bar */}
        <header
          className="sticky top-0 z-20 border-b backdrop-blur-lg px-6 py-3 flex items-center justify-between"
          style={{ background: "var(--bg-nav)", borderColor: "var(--border)" }}
        >
          <Link href="/" className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            View storefront
          </Link>
          <div className="text-xs" style={{ color: "var(--text-faint)" }}>
            {process.env.NEXT_PUBLIC_STORE_NAME || "Retro Rack"} · Admin
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
