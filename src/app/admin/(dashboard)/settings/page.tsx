"use client";
import { useEffect, useState } from "react";

type Tab = "store" | "homepage" | "commerce" | "policies" | "social" | "features";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "store", label: "Store info", icon: "🏪" },
  { id: "homepage", label: "Homepage", icon: "🏠" },
  { id: "commerce", label: "Commerce", icon: "💰" },
  { id: "policies", label: "Policies", icon: "📜" },
  { id: "social", label: "Social", icon: "📱" },
  { id: "features", label: "Features", icon: "⚙️" },
];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setErr("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  function field(key: string, value: any) {
    setSettings({ ...settings, [key]: value });
  }

  async function save() {
    setSaving(true);
    setErr("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      setSuccess("Settings saved");
      setTimeout(() => setSuccess(""), 2500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="animate-spin h-6 w-6" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Site Settings</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage store info, homepage content, policies, and more.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {success && <span className="text-green-400 text-sm font-semibold">{success}</span>}
          {err && <span className="text-[#ff3da6] text-sm font-semibold">{err}</span>}
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left ${
                tab === t.id ? "card" : "hover:bg-[var(--bg-ghost)]"
              }`}
              style={tab === t.id ? {} : { color: "var(--text-muted)" }}
            >
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="space-y-6">
          {tab === "store" && (
            <Section title="Store Information" description="Basic info about your store. Shown in the nav, footer, and emails.">
              <Input label="Store name" value={settings.storeName} onChange={(v) => field("storeName", v)} />
              <Input label="Tagline" value={settings.storeTagline} onChange={(v) => field("storeTagline", v)} hint="Short one-liner under your store name." />
              <Textarea label="Description" value={settings.storeDescription} onChange={(v) => field("storeDescription", v)} rows={3} hint="SEO description and about-page text." />
              <Input label="Contact email" type="email" value={settings.contactEmail} onChange={(v) => field("contactEmail", v)} />
              <Input label="Contact phone" type="tel" value={settings.contactPhone} onChange={(v) => field("contactPhone", v)} />
              <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-semibold mb-1">Shipping Origin / Local Pickup</h3>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  This address is used as the <strong>origin</strong> for live shipping rate calculation (Stallion Express).
                  Without these fields, checkout falls back to static estimates.
                </p>
                <Toggle label="Local pickup available" value={settings.pickupAvailable} onChange={(v) => field("pickupAvailable", v)} />
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <Input label="Pickup address line 1" value={settings.pickupLine1 || ""} onChange={(v) => field("pickupLine1", v)} placeholder="123 Main St" />
                  <Input label="Address line 2 (optional)" value={settings.pickupLine2 || ""} onChange={(v) => field("pickupLine2", v)} placeholder="Unit 4B" />
                  <Input label="City" value={settings.pickupCity || ""} onChange={(v) => field("pickupCity", v)} placeholder="Toronto" />
                  <Select
                    label="Province"
                    value={settings.pickupProvince || ""}
                    onChange={(v) => field("pickupProvince", v)}
                    options={[
                      ["", "— Select province —"],
                      ["AB", "Alberta"],
                      ["BC", "British Columbia"],
                      ["MB", "Manitoba"],
                      ["NB", "New Brunswick"],
                      ["NL", "Newfoundland and Labrador"],
                      ["NS", "Nova Scotia"],
                      ["NT", "Northwest Territories"],
                      ["NU", "Nunavut"],
                      ["ON", "Ontario"],
                      ["PE", "Prince Edward Island"],
                      ["QC", "Quebec"],
                      ["SK", "Saskatchewan"],
                      ["YT", "Yukon"],
                    ]}
                  />
                  <Input label="Postal code" value={settings.pickupPostalCode || ""} onChange={(v) => field("pickupPostalCode", v)} placeholder="M5V 2T6" />
                  <Select
                    label="Country"
                    value={settings.pickupCountry || "CA"}
                    onChange={(v) => field("pickupCountry", v)}
                    options={[["CA", "Canada"]]}
                  />
                </div>
              </div>
            </Section>
          )}

          {tab === "homepage" && (
            <>
              <Section title="Hero section" description="Main banner at the top of your homepage.">
                <Input label="Headline" value={settings.heroTitle} onChange={(v) => field("heroTitle", v)} />
                <Textarea label="Subheadline" value={settings.heroSubtitle} onChange={(v) => field("heroSubtitle", v)} rows={2} />
                <div className="grid md:grid-cols-2 gap-3">
                  <Input label="Button text" value={settings.heroButtonText} onChange={(v) => field("heroButtonText", v)} />
                  <Input label="Button link" value={settings.heroButtonLink} onChange={(v) => field("heroButtonLink", v)} hint="Internal (/shop) or external (https://…)" />
                </div>
              </Section>

              <Section title="Announcement bar" description="Thin banner shown at the top of every page.">
                <Toggle label="Show announcement bar" value={settings.announcementBarEnabled} onChange={(v) => field("announcementBarEnabled", v)} />
                <Input label="Announcement text" value={settings.announcementBar} onChange={(v) => field("announcementBar", v)} placeholder="Free shipping on orders over $50 🎮" />
              </Section>
            </>
          )}

          {tab === "commerce" && (
            <Section title="Commerce settings" description="Currency, tax, and shipping rules.">
              <div className="grid md:grid-cols-3 gap-3">
                <Select
                  label="Currency"
                  value={settings.currency}
                  onChange={(v) => field("currency", v)}
                  options={[
                    ["USD", "US Dollar (USD)"],
                    ["CAD", "Canadian Dollar (CAD)"],
                    ["EUR", "Euro (EUR)"],
                    ["GBP", "British Pound (GBP)"],
                    ["AUD", "Australian Dollar (AUD)"],
                  ]}
                />
                <Input label="Tax rate (%)" type="number" value={String(settings.taxRate)} onChange={(v) => field("taxRate", Number(v) || 0)} hint="e.g. 8.5 for 8.5%" />
                <Input label="Free shipping threshold" type="number" value={String(settings.freeShippingThreshold)} onChange={(v) => field("freeShippingThreshold", Number(v) || 0)} hint="0 = disabled" />
              </div>
            </Section>
          )}

          {tab === "policies" && (
            <Section title="Legal & policies" description="Markdown supported. These appear on dedicated pages.">
              <Textarea label="Return policy" value={settings.returnPolicy} onChange={(v) => field("returnPolicy", v)} rows={5} />
              <Textarea label="Shipping policy" value={settings.shippingPolicy} onChange={(v) => field("shippingPolicy", v)} rows={5} />
              <Textarea label="Privacy policy" value={settings.privacyPolicy} onChange={(v) => field("privacyPolicy", v)} rows={5} />
              <Textarea label="Terms of service" value={settings.termsOfService} onChange={(v) => field("termsOfService", v)} rows={5} />
            </Section>
          )}

          {tab === "social" && (
            <Section title="Social media" description="Add full URLs. Links will appear in the footer.">
              <Input label="Instagram" value={settings.socialInstagram} onChange={(v) => field("socialInstagram", v)} placeholder="https://instagram.com/…" />
              <Input label="X / Twitter" value={settings.socialTwitter} onChange={(v) => field("socialTwitter", v)} placeholder="https://x.com/…" />
              <Input label="Facebook" value={settings.socialFacebook} onChange={(v) => field("socialFacebook", v)} placeholder="https://facebook.com/…" />
              <Input label="TikTok" value={settings.socialTiktok} onChange={(v) => field("socialTiktok", v)} placeholder="https://tiktok.com/@…" />
            </Section>
          )}

          {tab === "features" && (
            <Section title="Feature toggles" description="Enable or disable site-wide features.">
              <Toggle
                label="Maintenance mode"
                hint="Hides the storefront and shows a 'coming soon' page. Admin still has access."
                value={settings.maintenanceMode}
                onChange={(v) => field("maintenanceMode", v)}
              />
              <Toggle
                label="Allow guest checkout"
                hint="If disabled, customers must sign in before purchasing."
                value={settings.allowGuestCheckout}
                onChange={(v) => field("allowGuestCheckout", v)}
              />
              <Toggle
                label="Show sold-out products"
                hint="If disabled, out-of-stock products are hidden from the shop."
                value={settings.showSoldOutProducts}
                onChange={(v) => field("showSoldOutProducts", v)}
              />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ———————————— Helpers ————————————

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <div>
        <h2 className="font-bold text-lg">{title}</h2>
        {description && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="textarea" rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{hint}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([val, lbl]) => (
          <option key={val} value={val}>{lbl}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${value ? "bg-[#9b5cff]" : ""}`}
        style={!value ? { background: "var(--bg-ghost-hover)" } : {}}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`}
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
        />
      </button>
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        {hint && <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{hint}</div>}
      </div>
    </label>
  );
}
