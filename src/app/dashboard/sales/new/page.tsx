import { auth } from "@/auth";
import { listSaleCommercialOptionsForUser } from "@/lib/sales/commercial-options";
import { SaleWizard } from "@/components/sales/sale-wizard";

export default async function NewSalePage() {
  const session = await auth();
  const commercials = await listSaleCommercialOptionsForUser(
    session?.user?.id,
    session?.user?.name,
  );

  return (
    <div className="w-full max-w-none space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Nouvelle vente</h2>
      <SaleWizard commercials={commercials} defaultCommercialId={session?.user?.id} />
    </div>
  );
}
