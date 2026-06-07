import { prisma } from "@/lib/prisma";
import { ClientWizard } from "@/components/clients/client-wizard";

export default async function NewClientPage() {
  const commercials = await prisma.user.findMany({
    where: { accountStatus: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Nouveau client</h2>
      <ClientWizard commercials={commercials} />
    </div>
  );
}
