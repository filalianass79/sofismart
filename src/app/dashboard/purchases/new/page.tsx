import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PurchaseWizard } from "@/components/purchases/purchase-wizard";
import { getPurchaseAccessFromSession } from "@/lib/server/purchase-access-session";

export default async function NewPurchasePage() {
  const access = await getPurchaseAccessFromSession();
  if (!access?.canCreate) {
    redirect("/dashboard/purchases");
  }

  const [depots, suppliers] = await Promise.all([
    prisma.depot.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
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

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/purchases"
        className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-950"
      >
        <ChevronLeft className="h-4 w-4" /> Retour aux achats
      </Link>
      <div>
        <h2 className="font-display text-3xl text-navy-950">Nouvel achat</h2>
        <p className="mt-1 text-sm text-navy-600">Assistant en 6 étapes</p>
      </div>
      <PurchaseWizard depots={depots} suppliers={suppliers} />
    </div>
  );
}
