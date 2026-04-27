"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Editable fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("customer");
  const [emailVerified, setEmailVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      })
      .then((data) => {
        setUser(data);
        setName(data.name);
        setEmail(data.email);
        setRole(data.role);
        setEmailVerified(data.emailVerified);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setSuccess("");
    try {
      const body: Record<string, unknown> = { name, email, role, emailVerified };
      if (newPassword) body.password = newPassword;

      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("User updated successfully");
      setNewPassword("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push("/admin/users");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="animate-spin h-6 w-6 text-white/50" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user && err) {
    return (
      <div className="text-center py-16">
        <p className="text-[#ff3da6]">{err}</p>
        <Link href="/admin/users" className="btn btn-ghost mt-4">Back to users</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="btn btn-ghost text-xs">Back</Link>
        <h1 className="text-2xl font-bold">Edit user</h1>
      </div>

      <form onSubmit={save} className="card p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Role</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Email status</label>
            <div className="flex items-center gap-3 h-10">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={emailVerified}
                  onChange={(e) => setEmailVerified(e.target.checked)}
                />
                {emailVerified ? (
                  <span className="text-green-400">Verified</span>
                ) : (
                  <span className="text-yellow-400">Not verified</span>
                )}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="label">New password <span className="text-white/40 font-normal">(leave blank to keep current)</span></label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
          />
        </div>

        {/* Meta info */}
        {user && (
          <div className="grid grid-cols-2 gap-3 text-sm text-white/50 pt-2 border-t border-white/10">
            <div>
              <span className="text-white/30 text-xs uppercase">Created</span>
              <div>{new Date(user.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-white/30 text-xs uppercase">Updated</span>
              <div>{new Date(user.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        )}

        {err && <div className="text-[#ff3da6] text-sm">{err}</div>}
        {success && <div className="text-green-400 text-sm">{success}</div>}

        <div className="flex items-center justify-between pt-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={deleteUser} className="btn btn-ghost text-[#ff6b9a] text-sm">
            Delete user
          </button>
        </div>
      </form>
    </div>
  );
}
