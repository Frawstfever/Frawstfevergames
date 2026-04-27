"use client";
import { useEffect, useState, useCallback } from "react";

export default function AdminMessagesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selected, setSelected] = useState<any>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "200" });
      if (filter === "unread") params.set("unread", "1");
      const res = await fetch(`/api/admin/messages?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setUnread(data.unread || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  async function markRead(id: string, read: boolean) {
    await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    fetchMessages();
    if (selected?._id === id) setSelected({ ...selected, read });
  }

  async function deleteMessage(id: string) {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    if (selected?._id === id) setSelected(null);
    fetchMessages();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Messages ({total})</h1>
          {unread > 0 && (
            <p className="text-sm mt-1" style={{ color: "var(--accent)" }}>
              {unread} unread
            </p>
          )}
        </div>
        <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-strong)" }}>
          <button
            onClick={() => setFilter("all")}
            className="px-4 py-2 text-sm"
            style={{
              background: filter === "all" ? "var(--bg-ghost-hover)" : "transparent",
              color: filter === "all" ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className="px-4 py-2 text-sm"
            style={{
              background: filter === "unread" ? "var(--bg-ghost-hover)" : "transparent",
              color: filter === "unread" ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            Unread{unread > 0 ? ` (${unread})` : ""}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[380px_1fr] gap-4">
        {/* List */}
        <div className="card overflow-hidden" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {loading && (
            <div className="p-8 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-faint)" }}>
              {filter === "unread" ? "No unread messages" : "No messages yet"}
            </div>
          )}
          {!loading && items.map((m) => (
            <button
              key={m._id}
              onClick={() => {
                setSelected(m);
                if (!m.read) markRead(m._id, true);
              }}
              className="w-full text-left p-4 border-b transition block"
              style={{
                borderColor: "var(--border)",
                background: selected?._id === m._id ? "var(--bg-ghost-hover)" : "transparent",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {!m.read && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />
                  )}
                  <span className="text-sm font-semibold truncate">{m.email}</span>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                  {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={`text-sm truncate ${m.read ? "" : "font-semibold"}`}>
                {m.title}
              </div>
              <div className="text-xs truncate mt-1" style={{ color: "var(--text-muted)" }}>
                {m.content}
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="card p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-sm" style={{ color: "var(--text-faint)" }}>
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Select a message to view</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{selected.title}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <a href={`mailto:${selected.email}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                      {selected.email}
                    </a>
                    <span style={{ color: "var(--text-faint)" }}>·</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {new Date(selected.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => markRead(selected._id, !selected.read)}
                    className="btn btn-ghost text-xs"
                  >
                    Mark {selected.read ? "unread" : "read"}
                  </button>
                  <button
                    onClick={() => deleteMessage(selected._id)}
                    className="btn btn-ghost text-xs"
                    style={{ color: "var(--danger)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {selected.content}
                </p>
              </div>

              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.title)}`}
                className="btn btn-primary inline-flex"
              >
                Reply by email
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
