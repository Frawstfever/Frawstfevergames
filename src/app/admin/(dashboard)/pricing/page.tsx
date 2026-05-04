"use client";
import { useState, useCallback, useEffect } from "react";
import ProgressModal from "@/components/admin/ProgressModal";

interface ProgressState {
  open: boolean;
  title: string;
  total: number;
  current: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  logs: string[];
  done: boolean;
}

const emptyProgress: ProgressState = {
  open: false,
  title: "",
  total: 0,
  current: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  logs: [],
  done: false,
};

export default function PricingSyncPage() {
  const [url, setUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [mode, setMode] = useState("update_all");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // PriceCharting sync state
  //   - applyToSellPrice: when true, variant sell prices are re-written from PC values
  //     (otherwise only the pcLoose/pcCIB/pcNew reference fields are refreshed)
  //   - fxRate: USD→CAD exchange rate (PC API returns USD; we display CAD)
  //   - markupPct: additional markup on top of the CAD-converted price
  const [pcApplySell, setPcApplySell] = useState(true);
  const [pcFxAuto, setPcFxAuto] = useState(true);
  const [pcFx, setPcFx] = useState(1.38);
  const [pcFxMeta, setPcFxMeta] = useState<{ rate: number; source: string; asOf: string } | null>(null);
  const [pcMarkup, setPcMarkup] = useState(7.5);

  // Load current live FX rate on mount so the preview is accurate
  useEffect(() => {
    fetch("/api/admin/forex")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.rate === "number") {
          setPcFxMeta({ rate: data.rate, source: data.source, asOf: data.asOf });
          setPcFx(data.rate);
        }
      })
      .catch(() => {});
  }, []);

  // PriceCharting import state
  const [importLimit, setImportLimit] = useState(100);
  const [importStock, setImportStock] = useState(0);
  const [importOverwrite, setImportOverwrite] = useState(false);

  // Progress modal
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);

  const runSSE = useCallback(async (url: string, fetchOpts: RequestInit, title: string) => {
    setProgress({ ...emptyProgress, open: true, title });

    try {
      const res = await fetch(url, fetchOpts);
      if (!res.ok || !res.body) {
        setProgress((p) => ({ ...p, done: true, logs: [...p.logs, `ERROR: HTTP ${res.status}`] }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const chunk of lines) {
          const line = chunk.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line);

            if (evt.type === "init") {
              setProgress((p) => ({ ...p, total: evt.total }));
            } else if (evt.type === "progress") {
              setProgress((p) => ({
                ...p,
                current: evt.processed,
                total: evt.total,
                created: evt.created,
                updated: evt.updated,
                skipped: evt.skipped,
                errors: evt.errors,
                logs: evt.log ? [...p.logs, evt.log] : p.logs,
              }));
            } else if (evt.type === "done") {
              setProgress((p) => ({
                ...p,
                current: evt.processed,
                created: evt.created,
                updated: evt.updated,
                skipped: evt.skipped,
                errors: evt.errors,
                done: true,
                logs: [...p.logs, `Done — ${evt.created} created, ${evt.updated} updated, ${evt.skipped} skipped, ${evt.errors} errors`],
              }));
            } else if (evt.type === "error") {
              setProgress((p) => ({
                ...p,
                done: true,
                logs: [...p.logs, `ERROR: ${evt.message}`],
              }));
            } else if (evt.type === "status") {
              setProgress((p) => ({
                ...p,
                logs: [...p.logs, evt.message],
              }));
            }
          } catch {}
        }
      }

      // Ensure done state
      setProgress((p) => (p.done ? p : { ...p, done: true }));
    } catch (e: unknown) {
      setProgress((p) => ({
        ...p,
        done: true,
        logs: [...p.logs, `ERROR: ${e instanceof Error ? e.message : "Connection failed"}`],
      }));
    }
  }, []);

  function runPCImport(dryRun: boolean) {
    runSSE(
      "/api/admin/pricecharting/import",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun,
          limit: importLimit,
          defaultStock: importStock,
          overwrite: importOverwrite,
        }),
      },
      dryRun ? "Import Preview (Dry Run)" : "Importing from PriceCharting"
    );
  }

  function runPCSync() {
    runSSE(
      "/api/admin/pricecharting/sync",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applyToSellPrice: pcApplySell,
          markupPct: pcMarkup,
          fxAuto: pcFxAuto,
          fxRate: pcFxAuto ? undefined : pcFx,
        }),
      },
      "Syncing PriceCharting Prices"
    );
  }

  async function runCSVSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/pricing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url || undefined,
          csv: csv || undefined,
          mode,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress modal */}
      <ProgressModal
        {...progress}
        onClose={() => setProgress(emptyProgress)}
      />

      <div>
        <h1 className="text-2xl font-bold mb-1">Price / Stock sync</h1>
        <p className="text-white/60 text-sm">
          Pull prices, stock, and market references from PriceCharting or any CSV source.
        </p>
      </div>

      {/* PriceCharting — import listings from your custom CSV */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Import listings from PriceCharting</h2>
          <p className="text-xs text-white/60">
            Pulls your custom PriceCharting price guide (the one your token unlocks)
            and creates a Product for every row — with the PriceCharting ID linked
            and variants pre-populated from loose / CIB / new / box-only / manual-only prices.
            Stock is set to the value below (0 by default; fill it in later on each product).
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label">Row limit</label>
            <input
              type="number"
              className="input"
              value={importLimit}
              min={1}
              max={5000}
              onChange={(e) => setImportLimit(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">Default stock per variant</label>
            <input
              type="number"
              className="input"
              value={importStock}
              min={0}
              onChange={(e) => setImportStock(Number(e.target.value) || 0)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={importOverwrite}
              onChange={(e) => setImportOverwrite(e.target.checked)}
            />
            Overwrite if PriceCharting ID already linked
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => runPCImport(true)}
            disabled={progress.open}
            className="btn btn-ghost"
          >
            Preview (dry run)
          </button>
          <button
            onClick={() => runPCImport(false)}
            disabled={progress.open}
            className="btn btn-primary"
          >
            Run import
          </button>
        </div>
      </section>

      {/* Fetch missing images */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Fetch missing cover images</h2>
          <p className="text-xs text-white/60">
            Scrapes PriceCharting product pages for cover images on all products
            that have a PriceCharting ID but are missing a cover image. This won't
            overwrite existing images.
          </p>
        </div>
        <button
          onClick={() =>
            runSSE(
              "/api/admin/pricecharting/fetch-images",
              { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
              "Fetching Missing Cover Images"
            )
          }
          disabled={progress.open}
          className="btn btn-primary"
        >
          Fetch missing images
        </button>
      </section>

      {/* PriceCharting live sync */}
      <section className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">PriceCharting live sync</h2>
            <p className="text-xs text-white/60">
              Fetches current loose / CIB / new prices for every product linked to a PriceCharting ID
              (set the link on each product's edit page).
            </p>
          </div>
          <a
            href="/api/admin/pricecharting/custom-csv"
            className="btn btn-ghost text-xs"
            target="_blank"
            rel="noreferrer"
          >
            Download my custom CSV
          </a>
        </div>

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={pcApplySell}
            onChange={(e) => setPcApplySell(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <b>Overwrite variant selling prices</b> with PriceCharting values
            <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              If off, only the pcNew / pcCIB / pcLoose reference fields update and your existing
              variant prices stay untouched.
            </span>
          </span>
        </label>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label flex items-center justify-between">
              <span>USD → CAD exchange rate</span>
              <label className="flex items-center gap-1.5 text-xs font-normal cursor-pointer" style={{ color: "var(--text-muted)" }}>
                <input
                  type="checkbox"
                  checked={pcFxAuto}
                  onChange={(e) => {
                    setPcFxAuto(e.target.checked);
                    if (e.target.checked && pcFxMeta) setPcFx(pcFxMeta.rate);
                  }}
                />
                Auto (live rate)
              </label>
            </label>
            <input
              type="number"
              step="0.0001"
              className="input"
              value={pcFxAuto && pcFxMeta ? pcFxMeta.rate : pcFx}
              onChange={(e) => { setPcFxAuto(false); setPcFx(Number(e.target.value) || 1); }}
              disabled={!pcApplySell || pcFxAuto}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              {pcFxAuto && pcFxMeta ? (
                <>
                  Live from <b>{pcFxMeta.source}</b> (as of {pcFxMeta.asOf}) ·{" "}
                  <button
                    type="button"
                    className="hover:underline"
                    style={{ color: "var(--accent)" }}
                    onClick={() => {
                      fetch("/api/admin/forex?refresh=1")
                        .then((r) => r.json())
                        .then((d) => {
                          if (typeof d.rate === "number") {
                            setPcFxMeta({ rate: d.rate, source: d.source, asOf: d.asOf });
                            setPcFx(d.rate);
                          }
                        })
                        .catch(() => {});
                    }}
                  >
                    Refresh
                  </button>
                </>
              ) : pcFxAuto ? (
                "Loading live rate…"
              ) : (
                "Manual override — re-enable Auto to use live rate."
              )}
            </p>
          </div>
          <div>
            <label className="label">Markup %</label>
            <input
              type="number"
              step="0.1"
              className="input"
              value={pcMarkup}
              onChange={(e) => setPcMarkup(Number(e.target.value) || 0)}
              disabled={!pcApplySell}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              Additional margin on top of the CAD-converted price.
            </p>
          </div>
        </div>

        <div className="rounded-lg p-3 text-xs" style={{ background: "var(--bg-ghost)", color: "var(--text-muted)" }}>
          <div className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Preview (AC2 New):</div>
          <div>PC USD $20.37 × FX {pcFx.toFixed(2)} = <b>C${(20.37 * pcFx).toFixed(2)}</b> (market)</div>
          <div>C${(20.37 * pcFx).toFixed(2)} × (1 + {pcMarkup}%) = <b style={{ color: "var(--accent)" }}>C${(20.37 * pcFx * (1 + pcMarkup / 100)).toFixed(2)}</b> (final sell price)</div>
          <div className="mt-2">
            Condition → PC mapping: <b>NEW</b> → new-price, <b>CIB / VG w/ manual</b> → cib-price,
            <b> VG no manual / Good / Well Used / Disc Only</b> → loose-price,
            <b> Box Only</b> → box-only-price, <b>Manual Only</b> → manual-only-price.
          </div>
        </div>

        <button onClick={runPCSync} disabled={progress.open} className="btn btn-primary">
          Run PriceCharting sync
        </button>
      </section>

      {/* CSV / Google Sheet sync */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-lg">CSV / Google Sheet sync</h2>
        <p className="text-xs text-white/60">
          Useful if you maintain inventory in your own spreadsheet. Match rows to variants by{" "}
          <code className="font-mono">sku</code>, or to products by <code className="font-mono">slug</code>.
        </p>

        <div>
          <label className="label">
            Published CSV URL (Google Sheet → File → Share → Publish to web → CSV)
          </label>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?output=csv"
          />
          <p className="text-xs text-white/50 mt-1">
            Or leave blank and paste raw CSV below. Defaults to{" "}
            <code className="font-mono">PRICE_SHEET_CSV_URL</code> env var.
          </p>
        </div>

        <div>
          <label className="label">Or paste CSV</label>
          <textarea
            className="textarea font-mono text-xs"
            rows={6}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={"sku,price,stock,reference_price\nGTA5-PS4-VGCM-001,14.99,3,19.99"}
          />
        </div>

        <div>
          <label className="label">Mode</label>
          <select className="select max-w-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="update_all">Update price + stock + reference</option>
            <option value="update_price">Update price only</option>
            <option value="update_stock">Update stock only</option>
            <option value="update_reference">Update reference price only</option>
          </select>
        </div>

        <button onClick={runCSVSync} disabled={loading} className="btn btn-ghost">
          {loading ? "Syncing…" : "Run CSV sync"}
        </button>

        {result && (
          <pre className="card p-3 text-xs overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}

        <div className="card p-4 text-sm text-white/80">
          <h3 className="font-semibold mb-1">Expected CSV columns</h3>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><code className="font-mono">sku</code> (required to match a variant)</li>
            <li><code className="font-mono">price</code> — new selling price</li>
            <li><code className="font-mono">stock</code> — new stock count</li>
            <li><code className="font-mono">reference_price</code> — "market reference" on the listing</li>
            <li><code className="font-mono">slug</code> — use instead of SKU to set reference at the product level</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
