"use client";
import { useRef, useState } from "react";

interface ImageManagerProps {
  coverImage: string;
  images: string[];
  onChange: (next: { coverImage: string; images: string[] }) => void;
}

export default function ImageManager({ coverImage, images, onChange }: ImageManagerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [err, setErr] = useState("");

  // Deduplicated list — ensure cover is always in images array
  const allImages = Array.from(new Set([
    ...(coverImage ? [coverImage] : []),
    ...images,
  ]));

  function emit(next: Partial<{ coverImage: string; images: string[] }>) {
    onChange({
      coverImage: next.coverImage !== undefined ? next.coverImage : coverImage,
      images: next.images !== undefined ? next.images : images,
    });
  }

  async function uploadFile(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: reader.result }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed");
          resolve(data.url);
        } catch (e: unknown) {
          setErr(e instanceof Error ? e.message : "Upload failed");
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files: FileList | File[]) {
    setErr("");
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) {
      setErr("Only image files are supported");
      return;
    }

    setUploading(true);
    setUploadCount({ done: 0, total: arr.length });

    const uploaded: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      const url = await uploadFile(arr[i]);
      if (url) uploaded.push(url);
      setUploadCount({ done: i + 1, total: arr.length });
    }

    if (uploaded.length > 0) {
      const newImages = [...images, ...uploaded];
      const newCover = coverImage || uploaded[0];
      emit({ coverImage: newCover, images: newImages });
    }

    setUploading(false);
    setUploadCount({ done: 0, total: 0 });
  }

  async function addFromUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setErr("");
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const newImages = [...images, data.url];
      const newCover = coverImage || data.url;
      emit({ coverImage: newCover, images: newImages });
      setUrlInput("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    const newImages = images.filter((i) => i !== url);
    let newCover = coverImage;
    if (coverImage === url) {
      newCover = newImages[0] || "";
    }
    emit({ coverImage: newCover, images: newImages });
  }

  function setAsCover(url: string) {
    // Ensure it's in images too
    const newImages = images.includes(url) ? images : [url, ...images];
    emit({ coverImage: url, images: newImages });
  }

  function moveImage(idx: number, dir: -1 | 1) {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    emit({ images: next });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      {/* Cover preview + gallery */}
      <div className="grid md:grid-cols-[200px_1fr] gap-4">
        {/* Big cover preview */}
        <div>
          <div className="label">Cover</div>
          <div className="aspect-[3/4] rounded-lg overflow-hidden border relative group"
               style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)" }}>
            {coverImage ? (
              <>
                <img src={coverImage} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(coverImage)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500"
                  title="Remove cover"
                  aria-label="Remove cover image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-sm gap-2"
                   style={{ color: "var(--text-faint)" }}>
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>No cover</span>
              </div>
            )}
          </div>
        </div>

        {/* Gallery grid */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="label mb-0">Gallery ({allImages.length})</div>
            {allImages.length > 0 && (
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                Click an image to set it as cover
              </span>
            )}
          </div>

          {/* Drop zone + images */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            className="rounded-lg border-2 border-dashed p-3 transition min-h-[180px]"
            style={{
              borderColor: isDragOver ? "var(--accent)" : "var(--border-strong)",
              background: isDragOver ? "var(--accent-soft)" : "var(--bg-surface-2)",
            }}
          >
            {allImages.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {allImages.map((url) => {
                  const idx = images.indexOf(url);
                  const isCover = url === coverImage;
                  return (
                    <div key={url} className="group relative">
                      <button
                        type="button"
                        onClick={() => setAsCover(url)}
                        className={`block w-full aspect-[3/4] rounded-md overflow-hidden border-2 transition ${
                          isCover ? "shadow-[0_0_0_2px_rgba(155,92,255,0.3)]" : ""
                        }`}
                        style={{
                          borderColor: isCover ? "var(--accent)" : "transparent",
                        }}
                        title={isCover ? "Current cover" : "Click to set as cover"}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>

                      {/* Badge: cover indicator */}
                      {isCover && (
                        <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: "var(--accent)", color: "#fff" }}>
                          COVER
                        </span>
                      )}

                      {/* Hover actions */}
                      <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition flex items-end justify-between p-1 pointer-events-none"
                           style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent 40%)" }}>
                        <div className="flex gap-0.5 pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => moveImage(idx, -1)}
                            disabled={idx <= 0 || isCover}
                            className="w-6 h-6 rounded bg-black/60 text-white text-xs hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                            title="Move left"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(idx, 1)}
                            disabled={idx >= images.length - 1 || isCover}
                            className="w-6 h-6 rounded bg-black/60 text-white text-xs hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                            title="Move right"
                          >
                            ▶
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="w-6 h-6 rounded bg-red-500/80 text-white text-xs hover:bg-red-500 flex items-center justify-center pointer-events-auto"
                          title="Remove"
                          aria-label="Remove image"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm gap-2"
                   style={{ color: "var(--text-faint)" }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Drop images here or use the buttons below</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn btn-ghost text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload images
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="flex-1 flex gap-2 min-w-[240px]">
          <input
            className="input"
            placeholder="Paste image URL (https://…)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFromUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={addFromUrl}
            disabled={!urlInput.trim() || uploading}
            className="btn btn-ghost text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {/* Upload progress */}
      {uploading && uploadCount.total > 0 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading {uploadCount.done} of {uploadCount.total}…
        </div>
      )}
      {uploading && uploadCount.total === 0 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading…
        </div>
      )}

      {err && <div className="text-sm text-[#ff5c8a]">{err}</div>}
    </div>
  );
}
