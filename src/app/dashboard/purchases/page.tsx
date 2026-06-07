import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPurchaseAccessFromSession } from "@/lib/server/purchase-access-session";
import { PurchasesList, type PurchaseRow } from "./purchases-list";

export default async function PurchasesPage() {
  const access = await getPurchaseAccessFromSession();
  if (!access) redirect("/dashboard");
  const canViewFinancials = access?.canViewFinancials ?? false;
  const canEdit = access?.canEdit ?? false;
  const canCreate = access?.canCreate ?? false;
  const canDelete = access?.canDelete ?? false;

  const rows = await prisma.purchase
    .findMany({
      orderBy: { purchaseDate: "desc" },
      take: 200,
      include: {
        supplier: true,
        vehicle: { include: { brand: true, carModel: true } },
        fees: true,
        payments: true,
      },
    })
    .catch(() => []);

  const serialized: PurchaseRow[] = rows.map((p) => ({
    id: p.id,
    reference: p.reference,
    purchaseDate: p.purchaseDate.toISOString(),
    status: p.status,
    paymentStatus: p.paymentStatus,
    totalPurchasePrice: canViewFinancials ? Number(p.totalPurchasePrice) : 0,
    basePrice: canViewFinancials ? Number(p.basePrice) : 0,
    supplier: { id: p.supplier.id, name: p.supplier.name, type: p.supplier.type },
    vehicle: p.vehicle
      ? {
          id: p.vehicle.id,
          brandLabel: p.vehicle.brand.label,
          modelLabel: p.vehicle.carModel.label,
          vin: p.vehicle.vin,
          plate: p.vehicle.plate,
          status: p.vehicle.status,
        }
      : null,
    fees: p.fees.map((f) => ({ amount: canViewFinancials ? Number(f.amount) : 0 })),
    payments: p.payments.map((pay) => ({ amount: canViewFinancials ? Number(pay.amount) : 0 })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-navy-950">Gestion des achats</h2>
        <p className="mt-1 text-sm text-navy-600">
          {canEdit
            ? "Cycle complet : fournisseur, facture, véhicule, paiements et documents."
            : "Consultation des achats — modification réservée au gérant et à l'administrateur."}
        </p>
      </div>
      <PurchasesList
        initialRows={serialized}
        canViewFinancials={canViewFinancials}
        canEdit={canEdit}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
