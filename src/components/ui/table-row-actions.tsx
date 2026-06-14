"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, Eye, Pencil, Trash2 } from "lucide-react";
import { SofiSpinner } from "@/components/ui/loading";
import { useFormFeedback } from "@/hooks/use-form-feedback";

export type ArchiveAction = {
  url: string;
  method?: "DELETE" | "PATCH" | "POST";
  body?: Record<string, unknown>;
  confirmMessage?: string;
  disabled?: boolean;
  title?: string;
};

export function TableRowActions({
  detailHref,
  editHref,
  onEdit,
  archive,
  remove,
  onComplete,
}: {
  detailHref: string;
  editHref?: string;
  onEdit?: () => void;
  archive?: ArchiveAction;
  /** Suppression définitive (icône corbeille) */
  remove?: ArchiveAction;
  /** Recharger la liste côté client après archivage */
  onComplete?: () => void;
}) {
  const router = useRouter();
  const { reportApiError } = useFormFeedback();
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  async function handleArchive() {
    if (!archive || archive.disabled) return;
    const msg = archive.confirmMessage ?? "Archiver cet élément ?";
    if (!confirm(msg)) return;
    setArchiveLoading(true);
    try {
      const res = await fetch(archive.url, {
        method: archive.method ?? "DELETE",
        headers: archive.body ? { "Content-Type": "application/json" } : undefined,
        body: archive.body ? JSON.stringify(archive.body) : undefined,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        reportApiError(j);
        return;
      }
      onComplete?.();
      router.refresh();
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleRemove() {
    if (!remove || remove.disabled) return;
    const msg = remove.confirmMessage ?? "Supprimer définitivement cet élément ?";
    if (!confirm(msg)) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(remove.url, {
        method: remove.method ?? "DELETE",
        headers: remove.body ? { "Content-Type": "application/json" } : undefined,
        body: remove.body ? JSON.stringify(remove.body) : undefined,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        reportApiError(j);
        return;
      }
      onComplete?.();
      router.refresh();
    } finally {
      setRemoveLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={detailHref}
        className="rounded p-1.5 text-navy-600 hover:bg-navy-950/5 hover:text-gold-700"
        title="Détail"
      >
        <Eye className="h-4 w-4" />
      </Link>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1.5 text-navy-600 hover:bg-navy-950/5 hover:text-gold-700"
          title="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        editHref && (
          <Link
            href={editHref}
            className="rounded p-1.5 text-navy-600 hover:bg-navy-950/5 hover:text-gold-700"
            title="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        )
      )}
      {archive && (
        <button
          type="button"
          disabled={archive.disabled || archiveLoading || removeLoading}
          onClick={handleArchive}
          className="rounded p-1.5 text-navy-600 hover:bg-morocco-500/10 hover:text-morocco-700 disabled:cursor-not-allowed disabled:opacity-40"
          title={archive.title ?? "Archiver"}
        >
          {archiveLoading ? <SofiSpinner size="xs" label="Archivage" /> : <Archive className="h-4 w-4" />}
        </button>
      )}
      {remove && (
        <button
          type="button"
          disabled={remove.disabled || archiveLoading || removeLoading}
          onClick={handleRemove}
          className="rounded p-1.5 text-navy-600 hover:bg-red-500/10 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          title={remove.title ?? "Supprimer"}
        >
          {removeLoading ? <SofiSpinner size="xs" label="Suppression" /> : <Trash2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
