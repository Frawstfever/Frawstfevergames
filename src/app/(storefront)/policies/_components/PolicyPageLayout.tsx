import Link from "next/link";

const TABS = [
  { id: "terms", label: "Terms", href: "/policies/terms" },
  { id: "privacy", label: "Privacy", href: "/policies/privacy" },
  { id: "returns", label: "Returns", href: "/policies/returns" },
  { id: "shipping", label: "Shipping", href: "/policies/shipping" },
];

export default function PolicyPageLayout({
  title,
  active,
  children,
}: {
  title: string;
  active: "terms" | "privacy" | "returns" | "shipping";
  children: string;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Please read this carefully. If you have questions, reach out via our{" "}
        <Link href="/contact" className="hover:underline" style={{ color: "var(--accent)" }}>
          contact page
        </Link>
        .
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className="px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition"
            style={{
              borderColor: t.id === active ? "var(--accent)" : "transparent",
              color: t.id === active ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="card p-6">
        <pre
          className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {children}
        </pre>
      </div>
    </div>
  );
}
