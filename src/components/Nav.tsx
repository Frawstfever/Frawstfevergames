"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useEffect, useState } from "react";
import CurrencyToggle from "./CurrencyToggle";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Nav() {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ name: string; role?: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.name) setUser(data); })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Retro Rack";

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-lg border-b"
      style={{ background: "var(--bg-nav)", borderColor: "var(--border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block w-8 h-8 rounded-md bg-gradient-to-br from-[#9b5cff] via-[#ff3da6] to-[#00e5ff]" />
          <span className="text-lg tracking-wider glow">{storeName}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/shop" className="nav-link">Shop</Link>
          <Link href="/shop?platform=PS5" className="nav-link">PS5</Link>
          <Link href="/shop?platform=Switch" className="nav-link">Switch</Link>
          <Link href="/shop?platform=Xbox Series" className="nav-link">Xbox</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/contact" className="nav-link">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <CurrencyToggle />

          {/* Logged in: show avatar + user's name */}
          {mounted && authChecked && user && (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className="btn btn-ghost text-sm">
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition hover:bg-[var(--bg-ghost-hover)]"
                title={`Hi, ${user.name}`}
                aria-label={user.name}
              >
                {user.avatarUrl ? (
                  <span
                    className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border"
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  </span>
                ) : (
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #9b5cff 0%, #ff3da6 100%)",
                      boxShadow: "0 2px 8px rgba(155, 92, 255, 0.35)",
                    }}
                  >
                    {getInitials(user.name)}
                  </span>
                )}
                <span className="text-sm font-medium hidden sm:inline max-w-[9rem] truncate">
                  {user.name}
                </span>
              </Link>
            </>
          )}

          {/* Not logged in (and auth check is done): show Sign in */}
          {mounted && authChecked && !user && (
            <Link href="/login" className="btn btn-ghost text-sm">
              Sign in
            </Link>
          )}

          {/* While auth is loading, reserve space with an invisible placeholder to avoid layout shift */}
          {mounted && !authChecked && (
            <span className="w-[88px] h-10" aria-hidden="true" />
          )}

          <Link href="/cart" className="btn btn-ghost relative">
            <span>Cart</span>
            {mounted && count > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-[#ff3da6] rounded-full w-5 h-5 flex items-center justify-center text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
