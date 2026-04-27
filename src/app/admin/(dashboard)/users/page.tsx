"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const PAGE_SIZES = [25, 50, 100, 200] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("customer");
  const [skipVerification, setSkipVerification] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createErr, setCreateErr] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (query) params.set("q", query);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchUsers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggleRole(id: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "customer" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchUsers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggleVerified(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerified: !current }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchUsers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateErr("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          skipVerification,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowCreate(false);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("customer"); setSkipVerification(false);
      fetchUsers();
    } catch (e: unknown) {
      setCreateErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Users ({total})</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="input max-w-xs"
            />
            <button type="submit" className="btn btn-ghost">Search</button>
          </form>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ New user</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50">Role:</span>
          {["", "customer", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-2 py-1 rounded ${roleFilter === r ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
            >
              {r || "All"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50">Show:</span>
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => { setPageSize(s); setPage(1); }}
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

      {/* Table */}
      {!loading && (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Joined</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u._id}>
                  <td className="font-semibold">
                    <Link href={`/admin/users/${u._id}`} className="hover:underline">
                      {u.name}
                    </Link>
                  </td>
                  <td className="text-white/70">{u.email}</td>
                  <td>
                    <span className={`chip ${u.role === "admin" ? "bg-[#9b5cff]/30 text-[#c9a5ff]" : ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.emailVerified ? (
                      <span className="text-green-400 text-xs font-semibold">Verified</span>
                    ) : (
                      <span className="text-yellow-400 text-xs font-semibold">Pending</span>
                    )}
                  </td>
                  <td className="text-xs text-white/50">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-right pr-4">
                    <div className="inline-flex gap-1">
                      <Link href={`/admin/users/${u._id}`} className="btn btn-ghost text-xs">Edit</Link>
                      <button
                        onClick={() => toggleRole(u._id, u.role)}
                        className="btn btn-ghost text-xs"
                        title={u.role === "admin" ? "Demote to customer" : "Promote to admin"}
                      >
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button
                        onClick={() => toggleVerified(u._id, u.emailVerified)}
                        className="btn btn-ghost text-xs"
                      >
                        {u.emailVerified ? "Unverify" : "Verify"}
                      </button>
                      <button
                        onClick={() => deleteUser(u._id, u.name)}
                        className="btn btn-ghost text-xs text-[#ff6b9a]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-white/40">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-white/50">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="btn btn-ghost text-xs disabled:opacity-30">First</button>
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-ghost text-xs disabled:opacity-30">Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
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
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn btn-ghost text-xs disabled:opacity-30">Next</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="btn btn-ghost text-xs disabled:opacity-30">Last</button>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Create new user</h2>
              <button onClick={() => setShowCreate(false)} className="btn btn-ghost text-xs">Close</button>
            </div>
            <form onSubmit={createUser} className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" required />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={skipVerification} onChange={(e) => setSkipVerification(e.target.checked)} />
                Skip email verification (mark as verified immediately)
              </label>
              {createErr && <div className="text-[#ff3da6] text-sm">{createErr}</div>}
              <button className="btn btn-primary w-full justify-center" disabled={createLoading}>
                {createLoading ? "Creating…" : "Create user"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
