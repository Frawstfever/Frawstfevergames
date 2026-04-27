import { connectDB } from "@/lib/mongodb";
import { getSettings } from "@/models/Settings";
import Link from "next/link";

// Default social URLs (used when Settings hasn't been configured yet)
const DEFAULTS = {
  contactEmail: "contact@frawstfevergames.ca",
  socialFacebook: "https://www.facebook.com/frawstfevergames",
  socialInstagram: "https://www.instagram.com/frawstfevergames",
  socialTwitter: "",
  socialTiktok: "",
};

async function loadSettings() {
  try {
    await connectDB();
    const s = await getSettings();
    return {
      storeName: s.storeName || "Frawst Fever Games",
      contactEmail: s.contactEmail?.trim() || DEFAULTS.contactEmail,
      facebook: s.socialFacebook?.trim() || DEFAULTS.socialFacebook,
      instagram: s.socialInstagram?.trim() || DEFAULTS.socialInstagram,
      twitter: s.socialTwitter?.trim() || DEFAULTS.socialTwitter,
      tiktok: s.socialTiktok?.trim() || DEFAULTS.socialTiktok,
    };
  } catch {
    return {
      storeName: "Frawst Fever Games",
      contactEmail: DEFAULTS.contactEmail,
      facebook: DEFAULTS.socialFacebook,
      instagram: DEFAULTS.socialInstagram,
      twitter: "",
      tiktok: "",
    };
  }
}

export default async function Footer() {
  const year = new Date().getFullYear();
  const s = await loadSettings();

  return (
    <footer className="mt-20 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-bold mb-2">
            <span className="inline-block w-8 h-8 rounded-md bg-gradient-to-br from-[#9b5cff] via-[#ff3da6] to-[#00e5ff]" />
            <span className="text-lg tracking-wider">{s.storeName}</span>
          </div>
          <p style={{ color: "var(--text-muted)" }} className="max-w-sm leading-relaxed">
            Pre-owned and new video games. Multiple conditions available.
            Ship across Canada or pick up locally.
          </p>

          {/* Social */}
          <div className="flex gap-3 mt-5">
            {s.facebook && (
              <a href={s.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"
                 className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-[var(--bg-ghost-hover)]"
                 style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"
                 className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-[var(--bg-ghost-hover)]"
                 style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            )}
            {s.twitter && (
              <a href={s.twitter} target="_blank" rel="noreferrer" aria-label="X (Twitter)"
                 className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-[var(--bg-ghost-hover)]"
                 style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            {s.tiktok && (
              <a href={s.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"
                 className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-[var(--bg-ghost-hover)]"
                 style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.89-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.07A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z"/>
                </svg>
              </a>
            )}
            <a href={`mailto:${s.contactEmail}`} aria-label="Email"
               className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-[var(--bg-ghost-hover)]"
               style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="font-semibold mb-3">Shop</h4>
          <ul className="space-y-2" style={{ color: "var(--text-muted)" }}>
            <li><Link href="/shop" className="hover:text-[var(--text-primary)]">All games</Link></li>
            <li><Link href="/shop?platform=PS5" className="hover:text-[var(--text-primary)]">PlayStation</Link></li>
            <li><Link href="/shop?platform=Switch" className="hover:text-[var(--text-primary)]">Nintendo</Link></li>
            <li><Link href="/shop?platform=Xbox Series" className="hover:text-[var(--text-primary)]">Xbox</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2" style={{ color: "var(--text-muted)" }}>
            <li><Link href="/contact" className="hover:text-[var(--text-primary)]">Contact us</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-[var(--text-primary)]">Shipping</Link></li>
            <li><Link href="/policies/returns" className="hover:text-[var(--text-primary)]">Returns</Link></li>
            <li><Link href="/policies/terms" className="hover:text-[var(--text-primary)]">Terms</Link></li>
            <li><Link href="/policies/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t py-5 px-4" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto text-xs flex flex-wrap justify-between gap-2" style={{ color: "var(--text-faint)" }}>
          <div>© {year} {s.storeName}. All rights reserved.</div>
          <div>Ships across Canada · Local pickup available</div>
        </div>
      </div>
    </footer>
  );
}
