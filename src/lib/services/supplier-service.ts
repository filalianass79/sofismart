import { prisma } from "@/lib/prisma";
import { nextSupplierReference } from "@/lib/references";
import type { SupplierType } from "@/generated/prisma/enums";
import type { SupplierWizardValues } from "@/lib/validations/supplier";

export function buildSupplierName(d: SupplierWizardValues): string {
  if (d.name?.trim()) return d.name.trim();
  if (d.type === "INDIVIDUAL") return `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
  return (d.companyName || d.tradeName || "Fournisseur").trim();
}

export async function createSupplier(data: SupplierWizardValues) {
  const reference = await nextSupplierReference(prisma);
  const name = buildSupplierName(data);
  return prisma.supplier.create({
    data: {
      reference,
      type: data.type as SupplierType,
      name,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      companyName: data.companyName || null,
      tradeName: data.tradeName || null,
      cin: data.cin || null,
      ice: data.ice || null,
      rc: data.rc || null,
      taxId: data.taxId || null,
      patent: data.patent || null,
      phone: data.phone || null,
      secondaryPhone: data.secondaryPhone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || "Maroc",
      contactName: data.contactName || null,
      contactRole: data.contactRole || null,
      contactPhone: data.contactPhone || null,
      preferredPaymentMethod: data.preferredPaymentMethod ?? null,
      paymentDelay: data.paymentDelay ?? null,
      bankName: data.bankName || null,
      iban: data.iban || null,
      notes: data.notes || null,
    },
  });
}
