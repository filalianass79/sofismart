/**
 * Injecte des données de démonstration en production pour tester l'application
 * (dépôts, marques, fournisseurs, clients, véhicules, achats validés).
 *
 * Sécurité : exige ALLOW_PROD_DEMO_SEED=true (évite un lancement accidentel).
 * Idempotent : références fixes préfixées PROD-DEMO — relançable sans doublons.
 *
 * Usage local :
 *   ALLOW_PROD_DEMO_SEED=true npm run seed:prod-demo
 *
 * Usage serveur (depuis /opt/sofismart) :
 *   ALLOW_PROD_DEMO_SEED=true ./scripts/seed-prod-demo.sh
 */
import dotenv from "dotenv";
dotenv.config({ path: process.env.ENV_FILE ?? ".env.production", override: true });
dotenv.config({ override: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_PREFIX = "PROD-DEMO";
const DEFAULT_COUNT = 10;

type VehicleSpec = {
  brandLabel: string;
  modelLabel: string;
  version: string;
  fuel: "DIESEL" | "ESSENCE" | "HYBRIDE";
  origin: "NEW" | "USED" | "IMPORTED";
};

const VEHICLE_CATALOG: VehicleSpec[] = [
  { brandLabel: "Renault", modelLabel: "Clio V", version: "Intens TCe 90", fuel: "ESSENCE", origin: "USED" },
  { brandLabel: "Renault", modelLabel: "Captur", version: "Zen TCe 140", fuel: "ESSENCE", origin: "NEW" },
  { brandLabel: "Peugeot", modelLabel: "208", version: "GT 1.2 PureTech 130", fuel: "ESSENCE", origin: "USED" },
  { brandLabel: "Peugeot", modelLabel: "3008", version: "GT Line 1.5 BlueHDi", fuel: "DIESEL", origin: "IMPORTED" },
  { brandLabel: "Toyota", modelLabel: "Corolla", version: "1.8 Hybrid Lounge", fuel: "HYBRIDE", origin: "NEW" },
  { brandLabel: "Toyota", modelLabel: "RAV4", version: "Hybrid Dynamic 2WD", fuel: "HYBRIDE", origin: "USED" },
  { brandLabel: "Volkswagen", modelLabel: "Golf 8", version: "1.5 TSI Style", fuel: "ESSENCE", origin: "USED" },
  { brandLabel: "BMW", modelLabel: "Série 3", version: "320d M Sport", fuel: "DIESEL", origin: "IMPORTED" },
  { brandLabel: "Mercedes-Benz", modelLabel: "GLC", version: "220 d 4Matic", fuel: "DIESEL", origin: "USED" },
  { brandLabel: "Audi", modelLabel: "A4", version: "35 TDI S line", fuel: "DIESEL", origin: "IMPORTED" },
];

const SUPPLIER_NAMES = [
  { type: "DEALERSHIP" as const, name: "Concession Atlas Auto", city: "Casablanca" },
  { type: "IMPORTER" as const, name: "Import Auto Europe", city: "Tanger" },
  { type: "DEALERSHIP" as const, name: "Premium Motors Rabat", city: "Rabat" },
  { type: "GARAGE" as const, name: "Garage Marrakech Motors", city: "Marrakech" },
  { type: "COMPANY" as const, name: "Renault Retail Maroc", city: "Casablanca" },
  { type: "INDIVIDUAL" as const, name: "Mohamed Cherkaoui", city: "Fès" },
  { type: "DEALERSHIP" as const, name: "Peugeot Center Agadir", city: "Agadir" },
  { type: "IMPORTER" as const, name: "Euro Cars Import", city: "Tanger" },
  { type: "GARAGE" as const, name: "Garage Oued Zem", city: "Khémisset" },
  { type: "COMPANY" as const, name: "Fleet Solutions SARL", city: "Casablanca" },
];

const CLIENT_SPECS = [
  { type: "INDIVIDUAL" as const, firstName: "Ahmed", lastName: "Benjelloun", city: "Casablanca", financialStatus: "GOOD_PAYER" as const },
  { type: "INDIVIDUAL" as const, firstName: "Fatima", lastName: "El Amrani", city: "Rabat", financialStatus: "GOOD_PAYER" as const },
  { type: "COMPANY" as const, companyName: "Transports Atlas SARL", city: "Casablanca", financialStatus: "AVERAGE" as const },
  { type: "COMPANY" as const, companyName: "Holding Marrakech Motors", city: "Marrakech", financialStatus: "GOOD_PAYER" as const },
  { type: "RESELLER" as const, companyName: "Auto Pro Fès", city: "Fès", financialStatus: "GOOD_PAYER" as const },
  { type: "INDIVIDUAL" as const, firstName: "Hassan", lastName: "Ouali", city: "Tanger", financialStatus: "RISK" as const },
  { type: "INDIVIDUAL" as const, firstName: "Leila", lastName: "Mansouri", city: "Agadir", financialStatus: "GOOD_PAYER" as const },
  { type: "COMPANY" as const, companyName: "Société BTP Oued Zem", city: "Khémisset", financialStatus: "AVERAGE" as const },
  { type: "INDIVIDUAL" as const, firstName: "Rachid", lastName: "Lamrani", city: "Casablanca", financialStatus: "GOOD_PAYER" as const },
  { type: "INDIVIDUAL" as const, firstName: "Nadia", lastName: "Berrada", city: "Rabat", financialStatus: "GOOD_PAYER" as const },
];

const COLORS = ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Argent", "Beige"];

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

function demoId(kind: string, index: number) {
  return `prod-demo-${kind}-${pad(index)}`;
}

async function ensureDepots(prisma: PrismaClient) {
  const existing = await prisma.depot.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    take: 2,
    select: { id: true, name: true },
  });

  if (existing.length >= 2) {
    console.log(`  Dépôts existants : ${existing[0].name}, ${existing[1].name}`);
    return { depotA: existing[0].id, depotB: existing[1].id };
  }

  const year = new Date().getFullYear();
  const depotA = await prisma.depot.upsert({
    where: { id: demoId("depot", 1) },
    update: { status: "ACTIVE" },
    create: {
      id: demoId("depot", 1),
      reference: `${DEMO_PREFIX}-DEP-${year}-01`,
      name: "Dépôt Casablanca (démo)",
      address: "Zone industrielle, Casablanca",
      city: "Casablanca",
      maxCapacity: 80,
      status: "ACTIVE",
    },
  });

  const depotB = await prisma.depot.upsert({
    where: { id: demoId("depot", 2) },
    update: { status: "ACTIVE" },
    create: {
      id: demoId("depot", 2),
      reference: `${DEMO_PREFIX}-DEP-${year}-02`,
      name: "Dépôt Rabat (démo)",
      address: "Avenue Allal Ben Abdellah, Rabat",
      city: "Rabat",
      maxCapacity: 40,
      status: "ACTIVE",
    },
  });

  console.log(`  Dépôts créés : ${depotA.name}, ${depotB.name}`);
  return { depotA: depotA.id, depotB: depotB.id };
}

async function ensureCatalog(prisma: PrismaClient) {
  const brandLabels = [...new Set(VEHICLE_CATALOG.map((v) => v.brandLabel))];
  const brandMap: Record<string, string> = {};

  for (const label of brandLabels) {
    const brand = await prisma.brand.upsert({
      where: { label },
      update: {},
      create: { label },
    });
    brandMap[label] = brand.id;
  }

  const modelMap: Record<string, string> = {};
  for (const spec of VEHICLE_CATALOG) {
    const brandId = brandMap[spec.brandLabel];
    const key = `${spec.brandLabel}|${spec.modelLabel}`;
    if (modelMap[key]) continue;
    const model = await prisma.vehicleModel.upsert({
      where: { brandId_label: { brandId, label: spec.modelLabel } },
      update: {},
      create: { brandId, label: spec.modelLabel },
    });
    modelMap[key] = model.id;
  }

  return { brandMap, modelMap };
}

async function main() {
  if (process.env.ALLOW_PROD_DEMO_SEED !== "true") {
    console.error(
      "Refusé : définissez ALLOW_PROD_DEMO_SEED=true pour confirmer l'injection de données de démo.",
    );
    console.error("Exemple : ALLOW_PROD_DEMO_SEED=true npm run seed:prod-demo");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("Erreur : DATABASE_URL manquant.");
    process.exit(1);
  }

  const count = Math.min(
    30,
    Math.max(1, Number.parseInt(process.env.PROD_DEMO_COUNT ?? String(DEFAULT_COUNT), 10) || DEFAULT_COUNT),
  );

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log(`\n>> Injection données démo production (${count} entrées par type)\n`);

    const admin =
      (await prisma.user.findFirst({
        where: { accountStatus: "ACTIVE", role: "COMMERCIAL" },
        orderBy: { createdAt: "asc" },
      })) ??
      (await prisma.user.findFirst({
        where: { accountStatus: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      }));

    if (!admin) {
      throw new Error("Aucun utilisateur actif trouvé — exécutez d'abord le seed production.");
    }

    const { depotA, depotB } = await ensureDepots(prisma);
    const { brandMap, modelMap } = await ensureCatalog(prisma);

    const supplierIds: string[] = [];
    console.log(">> Fournisseurs");
    for (let i = 1; i <= count; i++) {
      const spec = SUPPLIER_NAMES[(i - 1) % SUPPLIER_NAMES.length];
      const id = demoId("supplier", i);
      const isIndividual = spec.type === "INDIVIDUAL";
      const supplier = await prisma.supplier.upsert({
        where: { id },
        update: {
          name: spec.name,
          status: "ACTIVE",
        },
        create: {
          id,
          reference: `${DEMO_PREFIX}-FRN-${pad(i, 4)}`,
          type: spec.type,
          name: spec.name,
          firstName: isIndividual ? spec.name.split(" ")[0] : null,
          lastName: isIndividual ? spec.name.split(" ").slice(1).join(" ") : null,
          companyName: isIndividual ? null : spec.name,
          ice: `999${pad(i, 3)}000000${pad(i, 3)}`,
          phone: `+212600${pad(i)}${pad(i)}${pad(i)}${pad(i)}`,
          email: `fournisseur-demo-${pad(i)}@sofismart.test`,
          city: spec.city,
          country: "Maroc",
          status: "ACTIVE",
        },
      });
      supplierIds.push(supplier.id);
      console.log(`  ✓ ${supplier.reference} — ${supplier.name}`);
    }

    console.log(">> Clients");
    for (let i = 1; i <= count; i++) {
      const spec = CLIENT_SPECS[(i - 1) % CLIENT_SPECS.length];
      const id = demoId("client", i);
      const isCompany = spec.type === "COMPANY" || spec.type === "RESELLER";
      const displayName = isCompany
        ? spec.companyName!
        : `${spec.firstName} ${spec.lastName}`;

      const client = await prisma.client.upsert({
        where: { id },
        update: {
          name: displayName,
          assignedCommercialId: admin.id,
          relationshipStatus: "ACTIVE",
        },
        create: {
          id,
          reference: `${DEMO_PREFIX}-CLI-${pad(i, 4)}`,
          type: spec.type,
          name: displayName,
          firstName: isCompany ? null : spec.firstName,
          lastName: isCompany ? null : spec.lastName,
          companyName: isCompany ? spec.companyName : null,
          cin: isCompany ? null : `PD${pad(i, 6)}`,
          ice: isCompany ? `888${pad(i, 3)}000000${pad(i, 3)}` : null,
          phone: `+212611${pad(i)}${pad(i)}${pad(i)}${pad(i)}`,
          email: `client-demo-${pad(i)}@sofismart.test`,
          city: spec.city,
          country: "Maroc",
          assignedCommercialId: admin.id,
          relationshipStatus: "ACTIVE",
          financialStatus: spec.financialStatus,
          outstandingAmount: spec.financialStatus === "RISK" ? 45000 : 0,
        },
      });
      console.log(`  ✓ ${client.reference} — ${client.name}`);
    }

    console.log(">> Véhicules & achats");
    const year = new Date().getFullYear();
    for (let i = 1; i <= count; i++) {
      const spec = VEHICLE_CATALOG[(i - 1) % VEHICLE_CATALOG.length];
      const brandId = brandMap[spec.brandLabel];
      const modelId = modelMap[`${spec.brandLabel}|${spec.modelLabel}`];
      const supplierId = supplierIds[(i - 1) % supplierIds.length];
      const depotId = i % 2 === 0 ? depotB : depotA;

      const purchasePrice = 155_000 + (i % 8) * 18_500;
      const fees =
        spec.origin === "IMPORTED"
          ? [
              { type: "CUSTOMS" as const, amount: 12_000 },
              { type: "TRANSPORT" as const, amount: 6_000 },
            ]
          : spec.origin === "NEW"
            ? [{ type: "REGISTRATION" as const, amount: 4_500 }]
            : [
                { type: "CLEANING" as const, amount: 2_000 },
                { type: "TRANSPORT" as const, amount: 3_500 },
              ];
      const feesTotal = fees.reduce((a, f) => a + f.amount, 0);
      const costPrice = purchasePrice + feesTotal;
      const targetSalePrice = Math.round(costPrice * 1.14);
      const internalRef = `${DEMO_PREFIX}-V-${year}-${pad(i, 4)}`;
      const achRef = `${DEMO_PREFIX}-ACH-${year}-${pad(i, 4)}`;
      const purchaseDate = new Date(year, (i - 1) % 12, Math.min(28, i + 2));

      const vehicleStatus =
        i === count ? "PREPARATION" : i === count - 1 ? "RESERVED" : "IN_STOCK";
      const purchaseStatus = i === count - 2 ? "DRAFT" : "VALIDATED";
      const paymentStatus = purchaseStatus === "VALIDATED" ? "PAID" : "UNPAID";

      const vehicle = await prisma.vehicle.upsert({
        where: { internalRef },
        update: {
          status: vehicleStatus,
          costPrice,
          purchasePrice,
          extraFeesTotal: feesTotal,
          targetSalePrice,
          depotId,
        },
        create: {
          internalRef,
          brandId,
          modelId,
          version: spec.version,
          year: 2021 + (i % 4),
          mileage: 5_000 + i * 2_800,
          fuel: spec.fuel,
          transmission: "AUTOMATIQUE",
          color: COLORS[(i - 1) % COLORS.length],
          vin: `PRODDEMO${pad(i, 4)}VIN${year}`,
          plate: `${90000 + i}-${i % 2 === 0 ? "A" : "B"}-${pad(i)}`,
          origin: spec.origin,
          purchasePrice,
          extraFeesTotal: feesTotal,
          costPrice,
          targetSalePrice,
          status: vehicleStatus,
          depotId,
          conditionNotes: "Véhicule démo production — données de test SOFISMART",
        },
      });

      const existingPurchase = await prisma.purchase.findUnique({
        where: { vehicleId: vehicle.id },
        select: { id: true },
      });

      if (existingPurchase) {
        await prisma.purchaseFee.deleteMany({ where: { purchaseId: existingPurchase.id } });
        await prisma.purchase.update({
          where: { id: existingPurchase.id },
          data: {
            reference: achRef,
            supplierId,
            status: purchaseStatus,
            paymentStatus,
            costPrice,
            totalExpenses: feesTotal,
            totalPurchasePrice: purchasePrice,
            fees: { create: fees },
          },
        });
      } else {
        await prisma.purchase.create({
          data: {
            reference: achRef,
            vehicleId: vehicle.id,
            supplierId,
            purchaseDate,
            invoiceDate: purchaseDate,
            purchaseType: spec.origin === "IMPORTED" ? "IMPORT" : "LOCAL",
            status: purchaseStatus,
            amountHT: purchasePrice,
            taxAmount: 0,
            amountTTC: purchasePrice,
            totalPurchasePrice: purchasePrice,
            totalExpenses: feesTotal,
            costPrice,
            basePrice: purchasePrice,
            advancePaid: purchaseStatus === "VALIDATED" ? purchasePrice : 0,
            paymentStatus,
            paymentMethod: "TRANSFER",
            invoiceNumber: `FA-${achRef}`,
            notes: "Achat démo production SOFISMART",
            fees: { create: fees },
          },
        });
      }

      console.log(
        `  ✓ ${internalRef} → ${achRef} (${purchaseStatus}, véhicule ${vehicleStatus})`,
      );
    }

    console.log(`
✓ Terminé : ${count} fournisseurs, ${count} clients, ${count} véhicules/achats.
  Préfixe repère : ${DEMO_PREFIX}-*
  Achats disponibles à la vente : statut VALIDATED + véhicule IN_STOCK (sauf 2 derniers en brouillon/réservé/préparation).
  Pour supprimer plus tard, filtrez par référence commençant par « ${DEMO_PREFIX}- ».
`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
