import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { linkLegacyUsers, seedRbac } from "./seed-rbac";
import { seedNotifications } from "./seed-notifications";
import { seedEmails } from "./seed-emails";
import { seedDemoData } from "./seed-demo-data";
import { seedCashCategories } from "./seed-treasury";
import { seedProduction } from "./seed-production";
import { seedStaging } from "./seed-staging";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const seedMode =
    process.env.SEED_MODE ??
    (process.env.NODE_ENV === "production" ? "production" : "demo");

  if (seedMode === "production") {
    await seedProduction(prisma);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  if (seedMode === "staging") {
    await seedStaging(prisma);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  await seedRbac(prisma);
  await seedNotifications(prisma);
  await seedEmails(prisma);
  await seedCashCategories(prisma);
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: "ADMIN" },
  });
  const hash = await bcrypt.hash("SofiSmart2026!", 12);

  const depotA = await prisma.depot.upsert({
    where: { id: "seed-depot-casa" },
    update: {},
    create: {
      id: "seed-depot-casa",
      name: "Dépôt Casablanca",
      address: "Zone industrielle, Casablanca",
      city: "Casablanca",
      maxCapacity: 80,
    },
  });

  const depotB = await prisma.depot.upsert({
    where: { id: "seed-depot-rabat" },
    update: {},
    create: {
      id: "seed-depot-rabat",
      name: "Dépôt Rabat",
      address: "Avenue Allal Ben Abdellah, Rabat",
      city: "Rabat",
      maxCapacity: 40,
    },
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { reference: "SAL-2026-0001" },
    update: {},
    create: {
      reference: "SAL-2026-0001",
      firstName: "Admin",
      lastName: "SOFISMART",
      professionalEmail: "admin@sofismart.com",
      jobFunction: "ADMINISTRATEUR",
      department: "Direction",
      status: "ACTIVE",
      hireDate: new Date("2020-01-01"),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@sofismart.com" },
    update: {
      passwordHash: hash,
      role: "ADMIN",
      roleId: adminRole.id,
      employeeId: adminEmployee.id,
      accountStatus: "ACTIVE",
      username: "admin",
    },
    create: {
      email: "admin@sofismart.com",
      name: "Administrateur",
      username: "admin",
      passwordHash: hash,
      role: "ADMIN",
      roleId: adminRole.id,
      employeeId: adminEmployee.id,
      accountStatus: "ACTIVE",
    },
  });

  const commercialRole = await prisma.role.findUniqueOrThrow({
    where: { code: "COMMERCIAL" },
  });
  const commercialEmployee = await prisma.employee.upsert({
    where: { reference: "SAL-2026-0002" },
    update: {},
    create: {
      reference: "SAL-2026-0002",
      firstName: "Commercial",
      lastName: "Demo",
      professionalEmail: "commercial@sofismart.com",
      jobFunction: "COMMERCIAL",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "commercial@sofismart.com" },
    update: {
      passwordHash: hash,
      roleId: commercialRole.id,
      employeeId: commercialEmployee.id,
    },
    create: {
      email: "commercial@sofismart.com",
      name: "Commercial Demo",
      username: "commercial",
      passwordHash: hash,
      role: "COMMERCIAL",
      roleId: commercialRole.id,
      employeeId: commercialEmployee.id,
      accountStatus: "ACTIVE",
    },
  });

  await linkLegacyUsers(prisma);

  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-1" },
    update: { reference: "FRN-2026-0001" },
    create: {
      id: "seed-supplier-1",
      reference: "FRN-2026-0001",
      type: "DEALERSHIP",
      name: "Concession Premium Auto",
      companyName: "Concession Premium Auto",
      ice: "001234567000089",
      phone: "+212 5 22 00 00 00",
      email: "contact@premiumauto.ma",
      city: "Casablanca",
      status: "ACTIVE",
    },
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: { reference: "CLI-2026-0001" },
    create: {
      id: "seed-client-1",
      reference: "CLI-2026-0001",
      type: "INDIVIDUAL",
      name: "Client Particulier Demo",
      firstName: "Client",
      lastName: "Demo",
      cin: "AB123456",
      phone: "+212600000001",
      email: "client@example.com",
      city: "Casablanca",
      relationshipStatus: "ACTIVE",
      financialStatus: "GOOD_PAYER",
    },
  });

  const legacy = await prisma.client.findMany({
    where: {
      OR: [
        { reference: "CLI-LEGACY" },
        { NOT: { reference: { startsWith: "CLI-202" } } },
      ],
    },
  });
  let seq = 1;
  for (const c of legacy) {
    if (c.reference.startsWith("CLI-202")) continue;
    await prisma.client.update({
      where: { id: c.id },
      data: { reference: `CLI-2026-${String(seq++).padStart(4, "0")}` },
    });
  }

  const brandMercedes = await prisma.brand.upsert({
    where: { label: "Mercedes-Benz" },
    update: {},
    create: { label: "Mercedes-Benz" },
  });
  const brandAudi = await prisma.brand.upsert({
    where: { label: "Audi" },
    update: {},
    create: { label: "Audi" },
  });
  const modelClasseE = await prisma.vehicleModel.upsert({
    where: { brandId_label: { brandId: brandMercedes.id, label: "Classe E" } },
    update: {},
    create: { brandId: brandMercedes.id, label: "Classe E" },
  });
  const modelQ5 = await prisma.vehicleModel.upsert({
    where: { brandId_label: { brandId: brandAudi.id, label: "Q5" } },
    update: {},
    create: { brandId: brandAudi.id, label: "Q5" },
  });

  const v1 = await prisma.vehicle.upsert({
    where: { internalRef: "V-2026-0001" },
    update: {},
    create: {
      internalRef: "V-2026-0001",
      brandId: brandMercedes.id,
      modelId: modelClasseE.id,
      version: "220 d AMG Line",
      year: 2024,
      mileage: 12000,
      fuel: "DIESEL",
      transmission: "AUTOMATIQUE",
      color: "Noir",
      vin: "WDD2130041A000001",
      plate: "12345-A-1",
      origin: "USED",
      conditionNotes: "Excellent état, historique complet",
      purchasePrice: 380000,
      extraFeesTotal: 15000,
      costPrice: 395000,
      targetSalePrice: 430000,
      status: "IN_STOCK",
      depotId: depotA.id,
    },
  });

  await prisma.purchase.upsert({
    where: { vehicleId: v1.id },
    update: {},
    create: {
      reference: "ACH-2025-0001",
      vehicleId: v1.id,
      supplierId: supplier.id,
      purchaseDate: new Date("2025-11-15"),
      status: "VALIDATED",
      amountHT: 380000,
      amountTTC: 380000,
      totalPurchasePrice: 380000,
      totalExpenses: 15000,
      costPrice: 395000,
      basePrice: 380000,
      advancePaid: 380000,
      paymentStatus: "PAID",
      paymentMethod: "TRANSFER",
      fees: {
        create: [
          { type: "TRANSPORT", amount: 8000 },
          { type: "CLEANING", amount: 2000 },
          { type: "REGISTRATION", amount: 5000 },
        ],
      },
    },
  });

  const v2 = await prisma.vehicle.upsert({
    where: { internalRef: "V-2026-0002" },
    update: {},
    create: {
      internalRef: "V-2026-0002",
      brandId: brandAudi.id,
      modelId: modelQ5.id,
      version: "Sportback 40 TDI",
      year: 2023,
      mileage: 45000,
      fuel: "DIESEL",
      transmission: "AUTOMATIQUE",
      color: "Gris",
      vin: "WAUZZZF15N0000002",
      plate: "67890-B-2",
      matriculeW: "W-2026-002",
      origin: "IMPORTED",
      purchasePrice: 290000,
      extraFeesTotal: 35000,
      costPrice: 325000,
      targetSalePrice: 355000,
      finalSalePrice: 348000,
      status: "SOLD",
      depotId: depotB.id,
    },
  });

  await prisma.purchase.upsert({
    where: { vehicleId: v2.id },
    update: {},
    create: {
      reference: "ACH-2025-0002",
      vehicleId: v2.id,
      supplierId: supplier.id,
      purchaseDate: new Date("2025-09-01"),
      status: "VALIDATED",
      amountHT: 290000,
      amountTTC: 290000,
      totalPurchasePrice: 290000,
      totalExpenses: 35000,
      costPrice: 325000,
      basePrice: 290000,
      advancePaid: 290000,
      paymentStatus: "PAID",
      paymentMethod: "TRANSFER",
      fees: {
        create: [
          { type: "CUSTOMS", amount: 25000 },
          { type: "TRANSPORT", amount: 10000 },
        ],
      },
    },
  });

  await prisma.sale.upsert({
    where: { vehicleId: v2.id },
    update: {},
    create: {
      vehicleId: v2.id,
      clientId: client.id,
      saleDate: new Date("2026-01-10"),
      price: 350000,
      discount: 2000,
      margin: 23000,
      advanceReceived: 350000,
      paymentStatus: "PAID",
      paymentMethod: "TRANSFER",
      payments: {
        create: [
          {
            amount: 200000,
            method: "TRANSFER",
            direction: "FROM_CLIENT",
            paidAt: new Date("2026-01-05"),
          },
          {
            amount: 150000,
            method: "TRANSFER",
            direction: "FROM_CLIENT",
            paidAt: new Date("2026-01-10"),
          },
        ],
      },
    },
  });

  await prisma.companyProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      legalName: "SOFISMART SARL",
      tradeName: "SOFISMART",
      country: "Maroc",
      city: "Casablanca",
      phone: "+212 5 22 00 00 00",
      email: "contact@sofismart.com",
    },
  });

  await seedDemoData({
    prisma,
    passwordHash: hash,
    depotCasaId: depotA.id,
    depotRabatId: depotB.id,
  });

  console.log("\n——— Comptes de test (mot de passe : SofiSmart2026!) ———");
  console.log("  admin@sofismart.com");
  console.log("  commercial@sofismart.com | commercial2@sofismart.com");
  console.log(
    "  gerant@sofismart.com | comptable@sofismart.com | magasin@sofismart.com",
  );
  console.log(
    "——— Véhicules vente : V-2026-0001 + 30 achats test (V-0003 → 0032), V-0002 vendu, 1 réservé ———\n",
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
