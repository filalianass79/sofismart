import type { PrismaClient } from "@/generated/prisma/client";

const DEFAULT_CATEGORIES = [
  { name: "Encaissement client", type: "CREDIT" as const, requiresAttachment: false },
  { name: "Avance reçue", type: "CREDIT" as const, requiresAttachment: false },
  { name: "Remboursement frais", type: "CREDIT" as const, requiresAttachment: true },
  { name: "Ajustement positif", type: "CREDIT" as const, requiresAttachment: true },
  { name: "Paiement fournisseur", type: "DEBIT" as const, requiresAttachment: true },
  { name: "Frais carburant", type: "DEBIT" as const, requiresAttachment: true },
  { name: "Frais déplacement", type: "DEBIT" as const, requiresAttachment: false },
  { name: "Frais dépôt", type: "DEBIT" as const, requiresAttachment: false },
  { name: "Avance salarié", type: "DEBIT" as const, requiresAttachment: true },
  { name: "Achat fournitures", type: "DEBIT" as const, requiresAttachment: true },
];

export async function seedCashCategories(prisma: PrismaClient) {
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.cashCategory.upsert({
      where: { name_type: { name: cat.name, type: cat.type } },
      update: { requiresAttachment: cat.requiresAttachment, isActive: true },
      create: cat,
    });
  }
}
