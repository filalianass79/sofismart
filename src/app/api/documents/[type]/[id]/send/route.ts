import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { loadCommercialDocument } from "@/lib/documents/loaders";
import { assertPreviewType, logDocEvent } from "@/lib/documents/document-api-helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const gate = await requirePermissionFresh("ventes.view");
  if ("response" in gate) return gate.response;

  const { type, id } = await params;
  try {
    const docType = assertPreviewType(type);
    const data = await loadCommercialDocument(docType, id);

    let userId: string | null = null;
    let title = "Document disponible";
    let message = "";
    let link = `/dashboard/documents/preview/${type}/${id}`;

    if (data.type === "exit-voucher") {
      const v = await prisma.exitVoucher.findUnique({
        where: { id },
        select: { assignedWarehouseUserId: true, reference: true },
      });
      userId = v?.assignedWarehouseUserId ?? null;
      title = "Bon de sortie à traiter";
      message = `Le bon de sortie ${data.reference} est disponible. Merci de procéder à la sortie du véhicule.`;
      link = data.qrScanUrl.replace(process.env.NEXTAUTH_URL ?? "", "") || link;
    } else if (data.type === "sales-invoice") {
      const sale = await prisma.sale.findUnique({
        where: { id },
        select: { commercialId: true, client: { select: { name: true } } },
      });
      userId = sale?.commercialId ?? null;
      title = "Facture de vente";
      message = `La facture ${data.invoiceNumber} pour ${sale?.client?.name ?? "le client"} est prête.`;
    } else if (data.type === "delivery-note") {
      title = "Bon de livraison";
      message = `Le bon de livraison ${data.reference} a été généré.`;
    }

    if (userId) {
      await prisma.appNotification.create({
        data: { userId, title, message, link, type: "DOCUMENT" },
      });
    }

    await logDocEvent(type, id, "SENT", gate.session.user.id, {
      status: "SENT",
      sentAt: new Date(),
    });

    return NextResponse.json({ ok: true, notified: !!userId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
