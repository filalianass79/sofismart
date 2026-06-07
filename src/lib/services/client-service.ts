import { prisma } from "@/lib/prisma";
import { nextClientReference } from "@/lib/client-reference";
import { computeClientFinancials } from "@/lib/client-finance";
import { isProfessionalType } from "@/lib/client-labels";
import type { ClientType, Prisma } from "@/generated/prisma/client";

export function buildClientDisplayName(data: {
  type: ClientType;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  tradeName?: string | null;
  name?: string;
}): string {
  if (data.name?.trim()) return data.name.trim();
  if (isProfessionalType(data.type)) {
    return (data.companyName || data.tradeName || "Client professionnel").trim();
  }
  return `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || "Client particulier";
}

export type ClientInput = Prisma.ClientUncheckedCreateInput;

export function mapWizardToClientData(body: Record<string, unknown>, reference?: string): ClientInput {
  const type = body.type as ClientType;
  const name = buildClientDisplayName({
    type,
    firstName: body.firstName as string,
    lastName: body.lastName as string,
    companyName: body.companyName as string,
    tradeName: body.tradeName as string,
  });

  return {
    reference: reference ?? (body.reference as string),
    type,
    name,
    civility: (body.civility as ClientInput["civility"]) ?? null,
    firstName: (body.firstName as string) || null,
    lastName: (body.lastName as string) || null,
    companyName: (body.companyName as string) || null,
    tradeName: (body.tradeName as string) || null,
    cin: (body.cin as string) || null,
    ice: (body.ice as string) || null,
    rc: (body.rc as string) || null,
    taxId: (body.taxId as string) || null,
    patent: (body.patent as string) || null,
    activity: (body.activity as string) || null,
    birthDate: body.birthDate ? new Date(body.birthDate as string) : null,
    phone: (body.phone as string) || null,
    secondaryPhone: (body.secondaryPhone as string) || null,
    email: (body.email as string) || null,
    website: (body.website as string) || null,
    address: (body.address as string) || null,
    city: (body.city as string) || null,
    country: (body.country as string) || "Maroc",
    profession: (body.profession as string) || null,
    mainContactName: (body.mainContactName as string) || null,
    mainContactRole: (body.mainContactRole as string) || null,
    mainContactPhone: (body.mainContactPhone as string) || null,
    mainContactEmail: (body.mainContactEmail as string) || null,
    assignedCommercialId: (body.assignedCommercialId as string) || null,
    acquisitionSource: (body.acquisitionSource as ClientInput["acquisitionSource"]) ?? null,
    preferredPaymentMethod: (body.preferredPaymentMethod as ClientInput["preferredPaymentMethod"]) ?? null,
    paymentTerms: (body.paymentTerms as string) || null,
    paymentDelay: body.paymentDelay != null ? Number(body.paymentDelay) : null,
    bankName: (body.bankName as string) || null,
    iban: (body.iban as string) || null,
    creditLimit: body.creditLimit != null ? Number(body.creditLimit) : null,
    vatExempt: !!body.vatExempt,
    financialStatus: (body.financialStatus as ClientInput["financialStatus"]) ?? "GOOD_PAYER",
    relationshipStatus: (body.relationshipStatus as ClientInput["relationshipStatus"]) ?? "PROSPECT",
    notes: (body.notes as string) || null,
    isArchived: !!body.isArchived,
  };
}

export async function createClient(body: Record<string, unknown>) {
  const reference = await nextClientReference();
  const data = mapWizardToClientData(body, reference);
  return prisma.client.create({ data });
}

export async function updateClient(id: string, body: Record<string, unknown>) {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) throw new Error("Client introuvable");
  const merged = {
    type: body.type ?? existing.type,
    firstName: body.firstName ?? existing.firstName,
    lastName: body.lastName ?? existing.lastName,
    companyName: body.companyName ?? existing.companyName,
    tradeName: body.tradeName ?? existing.tradeName,
    ...body,
  };
  const data = mapWizardToClientData(merged, existing.reference);
  const { reference: _ref, ...updateData } = data;
  void _ref;
  return prisma.client.update({ where: { id }, data: updateData });
}

export async function syncClientBalances(clientId: string) {
  const sales = await prisma.sale.findMany({
    where: { clientId },
    include: { payments: true },
  });
  const fin = computeClientFinancials(sales);
  return prisma.client.update({
    where: { id: clientId },
    data: {
      currentBalance: fin.currentBalance,
      outstandingAmount: fin.outstandingAmount,
    },
  });
}

export async function getClientStats(clientId: string) {
  const sales = await prisma.sale.findMany({
    where: { clientId },
    include: {
      payments: true,
      vehicle: {
        select: {
          id: true,
          internalRef: true,
          brand: { select: { label: true } },
          carModel: { select: { label: true } },
        },
      },
    },
    orderBy: { saleDate: "desc" },
  });
  const fin = computeClientFinancials(sales);
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  return { ...fin, creditLimit: client?.creditLimit ? Number(client.creditLimit) : null, sales };
}

export async function archiveClient(clientId: string) {
  return prisma.client.update({
    where: { id: clientId },
    data: { isArchived: true, relationshipStatus: "INACTIVE" },
  });
}
