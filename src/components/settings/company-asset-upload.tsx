"use client";

import { UploadImage } from "@/components/ui/upload-image";
import { Download, ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { SofiSpinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

type AssetType = "logo" | "header" | "footer";

export function CompanyAssetUpload({
  label,
  hint,
  type,
  value,
  onChange,
  aspect = "wide",
  className,
}: {
  label: string;
  hint?: string;
  type: AssetType;
  value: string | null;
  onChange: (path: string | null) => void;
  aspect?: "square" | "wide" | "banner";
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const res = await fetch("/api/company-profile/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const { path } = await res.json();
      onChange(path);
    }
  }

  async function onRemove() {
    const res = await fetch(`/api/company-profile/upload?type=${type}`, { method: "DELETE" });
    if (res.ok) onChange(null);
  }

  const previewClass =
    aspect === "square"
      ? "h-24 w-24"
      : aspect === "banner"
        ? "h-20 w-full max-w-md"
        : "h-20 w-40";

  return (
    <div className={cn("text-sm", className)}>
      <span className="font-medium text-navy-700">{label}</span>
      {hint && <p className="mt-0.5 text-xs text-navy-500">{hint}</p>}
      <section className="mt-2 flex flex-wrap items-start gap-3" aria-label={label}>
        {value ? (
          <div className={cn("relative overflow-hidden rounded-lg border border-navy-950/15 bg-white shadow-sm", previewClass)}>
            <UploadImage src={value} alt="" fill className="object-contain p-1" />
            <div className="absolute right-1 top-1 flex gap-1">
              <a
                href={value}
                download
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-navy-950/70 p-1 text-white hover:bg-navy-950"
                aria-label="Télécharger"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => void onRemove()}
                className="rounded-full bg-navy-950/70 p-1 text-white hover:bg-navy-950"
                aria-label="Retirer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-navy-950/15 bg-white px-4 py-4 text-center transition-colors hover:border-gold-500/50 hover:bg-gold-500/5",
            aspect === "square" ? "h-24 w-24" : aspect === "banner" ? "min-h-20 w-full max-w-md flex-1" : "min-h-20 min-w-[8rem]"
          )}
        >
          {uploading ? (
            <SofiSpinner size="sm" label="Envoi…" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-navy-400" />
              <span className="mt-1 text-[10px] font-medium text-navy-500">Importer</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </section>
    </div>
  );
}
