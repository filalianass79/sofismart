"use client";

import { useState } from "react";
import { Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { normalizePublicUploadUrl } from "@/lib/storage/public-upload-url";

export function InvoicePreviewPanel({
  fileUrl,
  fileMimeType,
  fileName,
}: {
  fileUrl: string;
  fileMimeType: string;
  fileName: string;
}) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const isPdf = fileMimeType === "application/pdf";
  const previewUrl = normalizePublicUploadUrl(fileUrl) ?? fileUrl;

  const shell = fullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-navy-950"
    : "flex h-full min-h-[420px] flex-col rounded-xl border border-navy-950/10 bg-navy-950";

  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-white">
        <p className="truncate text-xs font-medium">{fileName}</p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 15))}
            className="rounded p-1.5 hover:bg-white/10"
            title="Zoom arrière"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(200, z + 15))}
            className="rounded p-1.5 hover:bg-white/10"
            title="Zoom avant"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="rounded p-1.5 hover:bg-white/10"
            title="Rotation"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="rounded p-1.5 hover:bg-white/10"
            title="Plein écran"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-2">
        {isPdf ? (
          <iframe
            src={previewUrl}
            title="Facture PDF"
            className="h-full min-h-[380px] w-full bg-white"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Facture"
            className="max-h-full max-w-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
