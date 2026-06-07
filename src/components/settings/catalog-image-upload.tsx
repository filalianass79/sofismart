"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { SofiSpinner } from "@/components/ui/loading";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CatalogImageUpload({
  label,
  value,
  onChange,
  aspect = "square",
  className,
}: {
  label: string;
  value: string | null;
  onChange: (path: string | null) => void;
  aspect?: "square" | "wide";
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/catalog/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const { path } = await res.json();
      onChange(path);
    }
  }

  return (
    <div className={cn("text-sm", className)}>
      <span className="text-navy-600">{label}</span>
      <section className="mt-2 flex flex-wrap items-start gap-3" aria-label={label}>
        {value ? (
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-navy-950/15 bg-white shadow-sm",
              aspect === "square" ? "h-20 w-20" : "h-20 w-28"
            )}
          >
            <Image src={value} alt="" fill className={aspect === "square" ? "object-contain p-1" : "object-cover"} />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded-full bg-navy-950/70 p-0.5 text-white hover:bg-navy-950"
              aria-label="Retirer l'image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-navy-950/15 bg-white px-4 py-4 text-center transition-colors hover:border-gold-500/50 hover:bg-gold-500/5",
            aspect === "square" ? "h-20 w-20" : "min-h-20 min-w-[7rem] flex-1"
          )}
        >
          {uploading ? (
            <SofiSpinner size="sm" label="Envoi de l'image" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-navy-400" />
              <span className="mt-1 text-[10px] font-medium text-navy-500">Ajouter</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </section>
    </div>
  );
}
