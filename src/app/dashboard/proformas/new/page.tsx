import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProformaWizard } from "@/components/proformas/proforma-wizard";

export default async function NewProformaPage() {
  const session = await auth();
  const commercials = await prisma.user.findMany({
    where: { accountStatus: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="w-full max-w-none space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Nouvelle facture proforma</h2>
      <ProformaWizard commercials={commercials} defaultCommercialId={session?.user?.id} />
    </div>
  );
}
