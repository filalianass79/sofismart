import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientWizard } from "@/components/clients/client-wizard";
import type { ClientWizardValues } from "@/lib/validations/client";

type Props = { params: Promise<{ id: string }> };

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const [client, commercials] = await Promise.all([
    prisma.client.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: { accountStatus: "ACTIVE" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  if (!client) notFound();

  const initial: Partial<ClientWizardValues> = {
    type: client.type,
    civility: client.civility ?? undefined,
    firstName: client.firstName ?? undefined,
    lastName: client.lastName ?? undefined,
    companyName: client.companyName ?? undefined,
    tradeName: client.tradeName ?? undefined,
    cin: client.cin ?? undefined,
    ice: client.ice ?? undefined,
    rc: client.rc ?? undefined,
    taxId: client.taxId ?? undefined,
    patent: client.patent ?? undefined,
    activity: client.activity ?? undefined,
    birthDate: client.birthDate?.toISOString().slice(0, 10),
    phone: client.phone ?? "",
    secondaryPhone: client.secondaryPhone ?? undefined,
    email: client.email ?? undefined,
    website: client.website ?? undefined,
    address: client.address ?? undefined,
    city: client.city ?? undefined,
    country: client.country ?? undefined,
    profession: client.profession ?? undefined,
    mainContactName: client.mainContactName ?? undefined,
    mainContactRole: client.mainContactRole ?? undefined,
    assignedCommercialId: client.assignedCommercialId ?? undefined,
    acquisitionSource: client.acquisitionSource ?? undefined,
    preferredPaymentMethod: client.preferredPaymentMethod ?? undefined,
    paymentTerms: client.paymentTerms ?? undefined,
    paymentDelay: client.paymentDelay ?? undefined,
    bankName: client.bankName ?? undefined,
    iban: client.iban ?? undefined,
    creditLimit: client.creditLimit ? Number(client.creditLimit) : undefined,
    vatExempt: client.vatExempt,
    financialStatus: client.financialStatus,
    relationshipStatus: client.relationshipStatus,
    notes: client.notes ?? undefined,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Modifier le client</h2>
      <ClientWizard commercials={commercials} clientId={id} initial={initial} />
    </div>
  );
}
