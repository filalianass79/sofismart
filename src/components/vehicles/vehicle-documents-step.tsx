"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { SofiSpinner } from "@/components/ui/loading";
import { documentCategoryLabels } from "@/lib/purchase-labels";
import { UploadImageThumb } from "@/components/ui/upload-image-thumb";
import { normalizePublicUploadUrl } from "@/lib/storage/public-upload-url";
import type { DocumentCategory } from "@/generated/prisma/enums";

/** Catégories de documents pertinentes pour un véhicule seul (hors flux achat). */
export const VEHICLE_DOC_CATEGORIES = [
  "PROVISIONAL_REGISTRATION_CARD",
  "REGISTRATION_CARD",
  "CONFORMITY_CERT",
  "CUSTOMS",
  "TRANSIT_DOC",
  "VEHICLE_PHOTO",
  "EXPERTISE_REPORT",
  "PROVISIONAL_INSURANCE",
  "OTHER",
] as const satisfies readonly DocumentCategory[];

export type VehicleDocumentRow = {
  id: string;
  category: string;
  originalName: string;
  path: string;
};

export function VehicleDocumentsStep({
  documents,
  uploading,
  onUpload,
  onRemove,
  vehicleSaved,
}: {
  documents: VehicleDocumentRow[];
  uploading: boolean;
  onUpload: (files: FileList | null, category: string) => void;
  onRemove: (id: string) => void;
  /** false tant que le véhicule n'est pas enregistré (brouillon) */
  vehicleSaved: boolean;
}) {
  const [category, setCategory] = useState<DocumentCategory>("REGISTRATION_CARD");

  return (
    <div className="space-y-4">
      <header>
        <h3 className="font-display text-xl text-navy-950">Documents véhicule</h3>
        <p className="mt-1 text-sm text-navy-500">
          Carte grise provisoire, carte grise définitive, conformité, photos, etc.
        </p>
      </header>

      {!vehicleSaved && (
        <p className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-sm text-navy-800">
          Enregistrez d&apos;abord l&apos;identification (étape suivante ou brouillon) pour pouvoir joindre des
          fichiers.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="input-sofi min-w-[12rem]"
          disabled={!vehicleSaved}
        >
          {VEHICLE_DOC_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {documentCategoryLabels[c]}
            </option>
          ))}
        </select>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white ${
            vehicleSaved ? "bg-navy-950 hover:bg-navy-900" : "cursor-not-allowed bg-navy-400"
          }`}
        >
          {uploading ? <SofiSpinner size="xs" label="Envoi du fichier" /> : null}
          Choisir fichiers (PDF, JPG, PNG)
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            disabled={!vehicleSaved || uploading}
            onChange={(e) => {
              onUpload(e.target.files, category);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <ul className="divide-y rounded-lg border border-navy-950/10">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-3">
              <UploadImageThumb src={d.path} name={d.originalName} />
              <span className="min-w-0 truncate">
                {documentCategoryLabels[d.category as DocumentCategory] ?? d.category} — {d.originalName}
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={normalizePublicUploadUrl(d.path) ?? d.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-gold-700 hover:underline"
              >
                Ouvrir
              </a>
              <button
                type="button"
                onClick={() => onRemove(d.id)}
                className="text-morocco-600 hover:text-morocco-800"
                title="Retirer de la liste"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {documents.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-navy-400">Aucun document joint</li>
        )}
      </ul>
    </div>
  );
}
