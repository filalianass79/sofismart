import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import { buildTreasuryActor } from "@/lib/treasury/treasury-api";
import { listCashboxes } from "@/lib/services/cashbox-service";
import { PaymentWizard } from "@/components/payments/payment-wizard";

export default async function NewPaymentPage() {
  const session = await auth();
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

  let cashboxes: { id: string; label: string }[] = [];
  if (session?.user?.id) {
    const perms = await loadUserPermissions(prisma, session.user.id);
    const actor = await buildTreasuryActor(session.user.id, perms);
    const boxes = await listCashboxes(actor);
    cashboxes = boxes
      .filter((b) => b.status === "ACTIVE")
      .map((b) => ({ id: b.id, label: `${b.reference} — ${b.name}` }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Nouveau paiement</h2>
      <PaymentWizard
        clients={clients.map((c) => ({ id: c.id, label: c.name }))}
        suppliers={suppliers.map((s) => ({ id: s.id, label: s.name }))}
        sales={sales.map((s) => ({ id: s.id, label: s.reference }))}
        purchases={purchases.map((p) => ({ id: p.id, label: p.reference }))}
        cashboxes={cashboxes}
      />
    </div>
  );
}
