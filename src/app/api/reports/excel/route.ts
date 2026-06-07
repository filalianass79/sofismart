import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { requirePurchaseViewAccess } from "@/lib/api-purchase-auth";
import { userCanViewFinancials } from "@/lib/rbac/financial-access";
import * as XLSX from "xlsx";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "stock";

  let sheet: XLSX.WorkSheet;
  let name: string;

  if (type === "purchases") {
    const gate = await requirePurchaseViewAccess();
    if ("response" in gate) return gate.response;
    if (!gate.canViewFinancials) {
      return NextResponse.json({ error: "Export financier non autorisé" }, { status: 403 });
    }

    const purchases = await prisma.purchase.findMany({
      orderBy: { purchaseDate: "desc" },
      take: 2000,
      include: {
        supplier: true,
        vehicle: { include: { brand: true, carModel: true } },
        fees: true,
        payments: true,
      },
    });
    const rows = purchases.map((p) => {
      const paid = p.payments.reduce((a, x) => a + Number(x.amount), 0);
      const fees = p.fees.reduce((a, f) => a + Number(f.amount), 0);
      return {
        Référence: p.reference,
        Date: p.purchaseDate.toISOString().slice(0, 10),
        Statut: p.status,
        "Statut paiement": p.paymentStatus,
        Fournisseur: p.supplier.name,
        Véhicule: p.vehicle ? formatVehicleTitle(p.vehicle) : "",
        "N° Chassis": p.vehicle?.vin ?? "",
        "Montant HT": Number(p.amountHT),
        TVA: Number(p.taxAmount),
        TTC: Number(p.amountTTC),
        Remise: Number(p.discount),
        "Prix total achat": Number(p.totalPurchasePrice),
        Frais: fees,
        "Prix de revient": Number(p.costPrice),
        Payé: paid,
        "Reste à payer": Math.max(0, Number(p.totalPurchasePrice) - paid),
      };
    });
    sheet = XLSX.utils.json_to_sheet(rows);
    name = "achats";
  } else {
    const gate = await requirePermission("reports:*");
    if ("response" in gate) return gate.response;
    const perms = gate.session.user.permissions ?? [];
    const roleCode = gate.session.user.roleCode ?? gate.session.user.role;
    const canViewFinancials = userCanViewFinancials(perms, roleCode);

    if (type === "sales") {
      const sales = await prisma.sale.findMany({
        orderBy: { saleDate: "desc" },
        take: 500,
        include: { client: true, vehicle: { include: { brand: true, carModel: true } } },
      });
      const rows = sales.map((s) => {
        const row: Record<string, string | number> = {
          Date: s.saleDate.toISOString().slice(0, 10),
          Client: s.client?.name ?? "—",
          Véhicule: formatVehicleTitle(s.vehicle),
          Prix: Number(s.price),
          Remise: Number(s.discount),
        };
        if (canViewFinancials) row.Marge = Number(s.margin);
        return row;
      });
      sheet = XLSX.utils.json_to_sheet(rows);
      name = "ventes";
    } else if (type === "clients") {
      const clients = await prisma.client.findMany({
        orderBy: { name: "asc" },
        take: 5000,
        include: {
          assignedCommercial: { select: { name: true } },
          sales: { include: { payments: true } },
        },
      });
      const rows = clients.map((c) => {
        const totalSales = c.sales.reduce((a, s) => a + Number(s.price) - Number(s.discount), 0);
        const paid = c.sales.flatMap((s) => s.payments).reduce((a, p) => a + Number(p.amount), 0);
        return {
          Référence: c.reference,
          Type: c.type,
          Nom: c.name,
          CIN: c.cin ?? "",
          ICE: c.ice ?? "",
          Téléphone: c.phone ?? "",
          Ville: c.city ?? "",
          Commercial: c.assignedCommercial?.name ?? "",
          Ventes: c.sales.length,
          "CA total": totalSales,
          Solde: Math.max(0, totalSales - paid),
          "Statut financier": c.financialStatus,
          Archivé: c.isArchived ? "Oui" : "Non",
        };
      });
      sheet = XLSX.utils.json_to_sheet(rows);
      name = "clients";
    } else {
      const vehicles = await prisma.vehicle.findMany({
        orderBy: { internalRef: "asc" },
        take: 1000,
        include: { depot: true, brand: true, carModel: true },
      });
      const rows = vehicles.map((v) => {
        const row: Record<string, string | number> = {
          Référence: v.internalRef,
          Marque: v.brand.label,
          Modèle: v.carModel.label,
          Statut: v.status,
          Dépôt: v.depot.name,
        };
        if (canViewFinancials) row["Prix de revient"] = Number(v.costPrice);
        return row;
      });
      sheet = XLSX.utils.json_to_sheet(rows);
      name = "stock";
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, name);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sofismart-${name}.xlsx"`,
    },
  });
}
