import { notFound } from "next/navigation";
import { loadCommercialDocument } from "@/lib/documents/loaders";
import { parseDocumentPreviewType } from "@/lib/documents/types";
import { findGeneratedDoc } from "@/lib/documents/document-queries";
import { getDocumentHistory } from "@/lib/documents/document-history-service";
import { DocumentPreviewClient } from "@/components/documents/document-preview-client";
import "@/styles/document-preview.css";

export default async function DocumentPreviewPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const docType = parseDocumentPreviewType(type);
  if (!docType) notFound();

  let data;
  try {
    data = await loadCommercialDocument(docType, id);
  } catch {
    notFound();
  }

  const genDoc = await findGeneratedDoc(type, id);
  const history = genDoc
    ? await getDocumentHistory(genDoc.id)
    : [];

  let backHref = "/dashboard/sales";
  if (docType === "proforma") {
    backHref = `/dashboard/proformas/${id}`;
  } else if ("saleId" in data && data.saleId) {
    backHref = `/dashboard/sales/${data.saleId}`;
  }

  return (
    <DocumentPreviewClient
      type={docType}
      data={data}
      backHref={backHref}
      history={history.map((h) => ({
        id: h.id,
        action: h.action,
        createdAt: h.createdAt.toISOString(),
        user: h.user,
      }))}
    />
  );
}
