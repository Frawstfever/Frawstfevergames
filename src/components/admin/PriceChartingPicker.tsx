"use client";
import { useState } from "react";

interface Hit {
  id: string;
  name: string;
  console: string;
  loose?: number;
  cib?: number;
  new?: number;
  releaseDate?: string;
}

export default function PriceChartingPicker({
  value,
  onPick,
}: {
  value?: string;
  onPick: (hit: Hit) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/pricecharting/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "search failed");
      setHits(data.products || []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Search PriceCharting (title & platform)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={search}
          disabled={loading}
        >
          {loading ? "…" : "Search"}
        </button>
      </div>
      {value && (
        <div className="text-xs text-white/60 mt-1">
          Linked PC ID: <code className="font-mono">{value}</code>
        </div>
      )}
      {err && <div className="text-[#ff3da6] text-sm mt-2">{err}</div>}
      {hits.length > 0 && (
        <div className="mt-2 card max-h-72 overflow-y-auto divide-y divide-white/10">
          {hits.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                onPick(h);
                setHits([]);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm"
            >
              <div className="font-medium">
                {h.name}{" "}
                <span className="text-white/50 text-xs">({h.console})</span>
              </div>
              <div className="text-xs text-white/60">
                {h.loose !== undefined && <>Loose ${h.loose.toFixed(2)} · </>}
                {h.cib !== undefined && <>CIB ${h.cib.toFixed(2)} · </>}
                {h.new !== undefined && <>New ${h.new.toFixed(2)} · </>}
                PC#{h.id}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
