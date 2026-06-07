import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { canViewFinancialsFromGate } from "@/lib/api-financial-auth";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { applyCompanyHeader, applyCompanyFooter, getCompanyDisplayName } from "@/lib/pdf/company-branding";

export async function GET(req: Request) {
  const gate = await requirePermission("reports:*");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "stock";

  const doc = new jsPDF({ orientation: "landscape" });
  const companyName = await getCompanyDisplayName();
  const startY = await applyCompanyHeader(doc, {
    title: `${companyName} — Rapport`,
    subtitle: type === "sales" ? "Ventes" : "Stock véhicules",
  });

  const canViewFinancials = canViewFinancialsFromGate({
    session: gate.session,
    permissions: gate.session.user.permissions,
  });

  if (type === "sales") {
    const sales = await prisma.sale.findMany({
      orderBy: { saleDate: "desc" },
      take: 200,
      include: { client: true, vehicle: { include: { brand: true, carModel: true } } },
    });
    const head = ["Date", "Client", "Véhicule", "Prix", "Remise", ...(canViewFinancials ? ["Marge"] : [])];
    autoTable(doc, {
      startY,
      head: [head],
      didDrawPage: () => {
        void applyCompanyFooter(doc, doc.getNumberOfPages());
      },
      body: sales.map((s) => {
        const row = [
          s.saleDate.toISOString().slice(0, 10),
          s.client?.name ?? "—",
          formatVehicleTitle(s.vehicle),
          String(s.price),
          String(s.discount),
        ];
        if (canViewFinancials) row.push(String(s.margin));
        return row;
      }),
    });
  } else {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { internalRef: "asc" },
      take: 500,
      include: { depot: true, brand: true, carModel: true },
    });
    const head = ["Réf.", "Marque", "Modèle", "Statut", "Dépôt", ...(canViewFinancials ? ["Prix revient"] : [])];
    autoTable(doc, {
      startY,
      head: [head],
      didDrawPage: () => {
        void applyCompanyFooter(doc, doc.getNumberOfPages());
      },
      body: vehicles.map((v) => {
        const row = [v.internalRef, v.brand.label, v.carModel.label, v.status, v.depot.name];
        if (canViewFinancials) row.push(String(v.costPrice));
        return row;
      }),
    });
  }

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sofismart-${type}.pdf"`,
    },
  });
}
