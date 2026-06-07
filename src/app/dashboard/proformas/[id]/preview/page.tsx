import { notFound } from "next/navigation";
import Link from "next/link";
import { loadProformaDocumentData } from "@/lib/documents/proforma-loader";
import { ProformaPreview } from "@/components/proformas/proforma-preview";

export default async function ProformaPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await loadProformaDocumentData(id);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link href={`/dashboard/proformas/${id}`} className="text-sm text-gold-800 hover:underline">
            ← Retour
          </Link>
          <Link
            href={`/dashboard/proformas/${id}/print`}
            className="rounded border px-3 py-1 text-sm font-medium"
          >
            Imprimer
          </Link>
          <a href={`/api/proformas/${id}/download`} className="rounded border px-3 py-1 text-sm font-medium">
            Télécharger PDF
          </a>
        </div>
        <ProformaPreview data={data} />
      </div>
    );
  } catch {
    notFound();
  }
}
