"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvatarUploader from "@/components/AvatarUploader";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [address, setAddress] = useState({
    line1: "", line2: "", city: "", state: "", postalCode: "", country: "",
  });

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/account/profile")
      .then(async (r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAvatarUrl(data.avatarUrl || "");
        if (data.address) setAddress({ ...address, ...data.address });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Canada-only shipping for now
      const body: Record<string, unknown> = { name, phone, avatarUrl, address: { ...address, country: "CA" } };
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
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account" className="btn btn-ghost text-xs">Back</Link>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Personal info */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-lg">Personal Information</h2>

          {/* Avatar */}
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
              <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6 space-y-4" id="address">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Delivery Location
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Required before you can place a shipped order. Auto-fills at checkout.
              </p>
            </div>
            {address.line1 && address.city && address.postalCode ? (
              <span className="chip" style={{ color: "var(--ok)", borderColor: "rgba(74, 222, 128, 0.3)", background: "rgba(74, 222, 128, 0.1)" }}>
                ✓ Set
              </span>
            ) : (
              <span className="chip" style={{ color: "var(--warn)", borderColor: "rgba(251, 191, 36, 0.3)", background: "rgba(251, 191, 36, 0.1)" }}>
                Required
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Address line 1</label>
              <input className="input" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address line 2</label>
              <input className="input" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            </div>
            <div>
              <label className="label">State / Province</label>
              <input className="input" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
            </div>
            <div>
              <label className="label">Postal code</label>
              <input className="input" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
            </div>
            <div>
              <label className="label">Country</label>
              <select className="select" value="CA" disabled>
                <option value="CA">Canada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Change Password</h2>
          <p className="text-xs text-white/50">Leave blank to keep your current password.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Current password</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {err && <div className="text-[#ff3da6] text-sm">{err}</div>}
        {success && <div className="text-green-400 text-sm">{success}</div>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
