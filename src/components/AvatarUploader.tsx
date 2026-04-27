"use client";
import { useRef, useState } from "react";

interface AvatarUploaderProps {
  name: string;
  avatarUrl: string;
  onChange: (url: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AvatarUploader({ name, avatarUrl, onChange }: AvatarUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErr("Only image files are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Max file size is 5MB");
      return;
    }
    setErr("");
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/account/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        onChange(data.url);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setErr("Failed to read file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    onChange("");
    setErr("");
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar preview */}
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-bold text-2xl text-white flex-shrink-0 border-2"
          style={{
            background: avatarUrl ? "var(--bg-surface-2)" : "linear-gradient(135deg, #9b5cff 0%, #ff3da6 100%)",
            borderColor: "var(--border-strong)",
            boxShadow: "0 4px 12px rgba(155, 92, 255, 0.25)",
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(name || "?")}</span>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center"
               style={{ background: "rgba(0, 0, 0, 0.55)" }}>
            <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-1 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn btn-ghost text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {avatarUrl ? "Change avatar" : "Upload avatar"}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={removeAvatar}
              disabled={uploading}
              className="btn btn-ghost text-sm"
              style={{ color: "var(--danger)" }}
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          PNG, JPG, GIF, or WebP. Max 5MB. Square images work best.
        </p>
        {err && <p className="text-xs" style={{ color: "var(--danger)" }}>{err}</p>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
