import { prisma } from "@/lib/prisma";
import { PaymentWizard } from "@/components/payments/payment-wizard";

export default async function NewPaymentPage() {
  const [clients, suppliers, sales, purchases] = await Promise.all([
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 }),
    prisma.supplier.findMany({ where: { isArchived: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.sale.findMany({
      where: { status: "VALIDATED" },
      select: { id: true, reference: true },
      orderBy: { saleDate: "desc" },
      take: 100,
    }),
    prisma.purchase.findMany({
      where: { status: "VALIDATED" },
      select: { id: true, reference: true },
      orderBy: { purchaseDate: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Nouveau paiement</h2>
      <PaymentWizard
        clients={clients.map((c) => ({ id: c.id, label: c.name }))}
        suppliers={suppliers.map((s) => ({ id: s.id, label: s.name }))}
        sales={sales.map((s) => ({ id: s.id, label: s.reference }))}
        purchases={purchases.map((p) => ({ id: p.id, label: p.reference }))}
      />
    </div>
  );
}
