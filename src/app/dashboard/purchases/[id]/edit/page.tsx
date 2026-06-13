import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PurchaseWizard } from "@/components/purchases/purchase-wizard";
import { buildWizardFromPurchase } from "@/lib/purchase-service";
import { catalogFromVehicle } from "@/lib/vehicle-catalog";
import { getPurchaseAccessFromSession } from "@/lib/server/purchase-access-session";

type Props = { params: Promise<{ id: string }> };

export default async function EditPurchasePage({ params }: Props) {
  const { id } = await params;
  const access = await getPurchaseAccessFromSession();
  if (!access?.canEdit) {
    redirect(`/dashboard/purchases/${id}`);
  }

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      fees: true,
      supplier: true,
      vehicle: { include: { brand: true, carModel: true } },
      payments: true,
      documents: true,
    },
  });
  if (!purchase) notFound();

  const [depots, suppliers] = await Promise.all([
    prisma.depot
      .findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
      .catch(() => []),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        cin: true,
        ice: true,
        rc: true,
        phone: true,
        email: true,
        city: true,
      },
    }),
  ]);

  const initialValues = buildWizardFromPurchase(purchase);

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/purchases/${id}`}
        className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-950"
      >
        <ChevronLeft className="h-4 w-4" /> Retour au détail
      </Link>
      <div>
        <h2 className="font-display text-3xl text-navy-950">Modifier l&apos;achat {purchase.reference}</h2>
      </div>
      <PurchaseWizard
        depots={depots}
        suppliers={suppliers}
        purchaseId={id}
        initialValues={initialValues}
        initialCatalog={purchase.vehicle ? catalogFromVehicle(purchase.vehicle) : undefined}
      />
    </div>
  );
}
