import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SaleWizard } from "@/components/sales/sale-wizard";

export default async function NewSalePage() {
  const session = await auth();
  const commercials = await prisma.user.findMany({
      where: { accountStatus: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

  return (
    <div className="w-full max-w-none space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Nouvelle vente</h2>
      <SaleWizard commercials={commercials} defaultCommercialId={session?.user?.id} />
    </div>
  );
}
