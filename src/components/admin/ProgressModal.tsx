"use client";

interface ProgressModalProps {
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
  onClose: () => void;
}

export default function ProgressModal({
  open,
  title,
  total,
  current,
  created,
  updated,
  skipped,
  errors,
  logs,
  done,
  onClose,
}: ProgressModalProps) {
  if (!open) return null;

  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-xl mx-4 p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{title}</h2>
          {done && (
            <button onClick={onClose} className="btn btn-ghost text-xs">
              Close
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>
              {done ? "Complete" : "Processing…"} {current} / {total}
            </span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: done
                  ? errors > 0
                    ? "linear-gradient(90deg, #f87171, #ef4444)"
                    : "linear-gradient(90deg, #4ade80, #22c55e)"
                  : "linear-gradient(90deg, #9b5cff, #6d28d9)",
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-sm text-center">
          <div>
            <div className="text-green-400 font-bold text-lg">{created}</div>
            <div className="text-white/50 text-xs">Created</div>
          </div>
          <div>
            <div className="text-yellow-400 font-bold text-lg">{updated}</div>
            <div className="text-white/50 text-xs">Updated</div>
          </div>
          <div>
            <div className="text-white/60 font-bold text-lg">{skipped}</div>
            <div className="text-white/50 text-xs">Skipped</div>
          </div>
          <div>
            <div className="text-red-400 font-bold text-lg">{errors}</div>
            <div className="text-white/50 text-xs">Errors</div>
          </div>
        </div>

        {/* Live log */}
        <div className="flex-1 min-h-0">
          <div className="text-xs text-white/50 mb-1">Activity log</div>
          <div className="bg-black/40 rounded p-3 text-xs font-mono space-y-0.5 max-h-60 overflow-y-auto"
               ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
            {logs.length === 0 && (
              <div className="text-white/30">Waiting…</div>
            )}
            {logs.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("ERROR")
                    ? "text-red-400"
                    : line.startsWith("Created") || line.startsWith("[Dry run] Would import")
                      ? "text-green-400"
                      : line.startsWith("Updated")
                        ? "text-yellow-400"
                        : line.startsWith("Skipped")
                          ? "text-white/40"
                          : "text-white/70"
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Spinner or done icon */}
        {!done && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing products…
          </div>
        )}
      </div>
    </div>
  );
}
