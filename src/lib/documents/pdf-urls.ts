import type { DocumentPreviewType } from "@/lib/documents/types";

/** Liens API PDF — module client-safe (pas d'import Prisma / services). */
export function pdfDownloadUrl(type: DocumentPreviewType, id: string) {
  switch (type) {
    case "exit-voucher":
      return `/api/exit-vouchers/${id}/pdf`;
    case "delivery-note":
      return `/api/warehouse/delivery-notes/${id}/pdf`;
    case "sales-invoice":
      return `/api/sales/${id}/invoice/pdf`;
  }
}

export function pdfFileName(type: DocumentPreviewType, reference: string) {
  const safe = reference.replace(/\//g, "-");
  switch (type) {
    case "exit-voucher":
      return `bon-sortie-${safe}.pdf`;
    case "delivery-note":
      return `bon-livraison-${safe}.pdf`;
    case "sales-invoice":
      return `facture-vente-${safe}.pdf`;
  }
}
