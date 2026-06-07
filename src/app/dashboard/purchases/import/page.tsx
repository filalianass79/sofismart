import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPurchaseAccessFromSession } from "@/lib/server/purchase-access-session";
import { PurchaseInvoiceImportWorkspace } from "@/components/purchases/invoice-import/purchase-invoice-import-workspace";

export default async function PurchaseInvoiceImportPage() {
  const access = await getPurchaseAccessFromSession();
  if (!access) redirect("/dashboard");
  if (!access.canCreate) redirect("/dashboard/purchases");

  const [depots, suppliers] = await Promise.all([
    prisma.depot.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.supplier.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PurchaseInvoiceImportWorkspace
        depots={depots}
        suppliers={suppliers}
        canEdit={access.canEdit}
      />
    </div>
  );
}
