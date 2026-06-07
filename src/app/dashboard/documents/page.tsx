import { prisma } from "@/lib/prisma";
import { DocumentUpload } from "./upload";
import { DocumentsList, type DocumentRow } from "@/components/documents/documents-list";

export default async function DocumentsPage() {
  const docs = await prisma.document
    .findMany({ orderBy: { createdAt: "desc" }, take: 80 })
    .catch(() => []);

  const rows: DocumentRow[] = docs.map((d) => ({
    id: d.id,
    createdAt: d.createdAt.toISOString(),
    category: d.category,
    originalName: d.originalName,
    path: d.path,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl text-navy-950">Documents</h2>
        <p className="text-sm text-navy-600">Factures, cartes grises, contrats — stockés sous /public/uploads</p>
      </div>
      <DocumentUpload />
      <DocumentsList initialRows={rows} />
    </div>
  );
}
