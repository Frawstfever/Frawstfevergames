"use client";
import { useEffect, useState } from "react";
import AvatarUploader from "@/components/AvatarUploader";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!data) return;
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAvatarUrl(data.avatarUrl || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setErr("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = { name, phone, avatarUrl };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Profile updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 2500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Update your admin avatar, name, phone, and password.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {success && <span className="text-sm font-semibold" style={{ color: "var(--ok)" }}>{success}</span>}
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <form onSubmit={save} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-lg">Personal Information</h2>

          <div className="pb-5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="label mb-3">Avatar</div>
            <AvatarUploader name={name} avatarUrl={avatarUrl} onChange={setAvatarUrl} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input opacity-60" value={email} disabled />
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Email cannot be changed</p>
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Change Password</h2>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Leave blank to keep your current password.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Current password</label>
              <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label className="label">New password</label>
              <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
        </div>

        {err && <div className="text-sm" style={{ color: "var(--danger)" }}>{err}</div>}
      </form>
    </div>
  );
}
