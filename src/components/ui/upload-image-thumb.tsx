"use client";

import { UploadImage } from "@/components/ui/upload-image";
import { isImageUploadPath, normalizePublicUploadUrl } from "@/lib/storage/public-upload-url";
import { cn } from "@/lib/utils";

type UploadImageThumbProps = {
  src: string | null | undefined;
  mimeType?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
};

const sizeClass = {
  xs: "h-8 w-8",
  sm: "h-10 w-10",
  md: "h-14 w-14",
} as const;

/** Miniature pour listes de documents / formulaires (images uploadées uniquement). */
export function UploadImageThumb({ src, mimeType, name, size = "sm", className }: UploadImageThumbProps) {
  const normalized = normalizePublicUploadUrl(src);
  if (!normalized || !isImageUploadPath(normalized, mimeType ?? name)) return null;

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-lg border border-navy-950/10 bg-cream-50",
        sizeClass[size],
        className,
      )}
    >
      <UploadImage src={normalized} alt="" fill className="object-cover" />
    </span>
  );
}
