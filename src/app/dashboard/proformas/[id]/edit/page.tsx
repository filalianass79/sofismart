import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProformaById } from "@/lib/services/proforma-service";
import { ProformaWizard } from "@/components/proformas/proforma-wizard";
import { isProformaEditable } from "@/lib/proforma-labels";

export default async function EditProformaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getProformaById(id);
  if (!row) notFound();
  if (!isProformaEditable(row.status)) redirect(`/dashboard/proformas/${id}`);

  const session = await auth();
  const commercials = await prisma.user.findMany({
    where: { accountStatus: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const initialValues = {
    clientMode: row.clientId ? ("EXISTING" as const) : ("NEW" as const),
    clientId: row.clientId ?? "",
    newClient: row.temporaryClientData as never,
    vehicleId: row.vehicleId,
    financedByCreditOrg: !!row.creditOrganizationId,
    creditOrganizationId: row.creditOrganizationId ?? "",
    commercialId: row.commercialId,
    proformaDate: row.proformaDate.toISOString().slice(0, 10),
    validityDate: row.validityDate.toISOString().slice(0, 10),
    priceHT: Number(row.priceHT),
    discount: Number(row.discount),
    accessoryFees: Number(row.accessoryFees),
    taxRate: Number(row.taxRate),
    paymentTerms: row.paymentTerms ?? "",
    observations: row.observations ?? "",
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Modifier {row.reference}</h2>
      <ProformaWizard
        editId={id}
        commercials={commercials}
        defaultCommercialId={session?.user?.id}
        initialValues={initialValues}
      />
    </div>
  );
}
