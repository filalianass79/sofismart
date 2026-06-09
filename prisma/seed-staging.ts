/**
 * Seed complet environnement TEST / STAGING
 * Comptes @test.sofismart.com — mot de passe admin: Admin123* | autres: Test123*
 */
import bcrypt from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";
import { seedRbac, linkLegacyUsers } from "./seed-rbac";
import { seedNotifications } from "./seed-notifications";
import { seedEmails } from "./seed-emails";

const STAGING_PASSWORDS = {
  admin: "Admin123*",
  default: "Test123*",
} as const;

type StagingUser = {
  email: string;
  name: string;
  username: string;
  roleCode: string;
  legacyRole: "ADMIN" | "COMMERCIAL" | "DEPOT_MANAGER" | "ACCOUNTANT";
  jobFunction: string;
  ref: string;
  password: string;
};

const STAGING_USERS: StagingUser[] = [
  {
    email: "admin@test.sofismart.com",
    name: "Admin Test",
    username: "admin-test",
    roleCode: "ADMIN",
    legacyRole: "ADMIN",
    jobFunction: "ADMINISTRATEUR",
    ref: "STG-SAL-0001",
    password: STAGING_PASSWORDS.admin,
  },
  {
    email: "commercial@test.sofismart.com",
    name: "Commercial Test",
    username: "commercial-test",
    roleCode: "COMMERCIAL",
    legacyRole: "COMMERCIAL",
    jobFunction: "COMMERCIAL",
    ref: "STG-SAL-0002",
    password: STAGING_PASSWORDS.default,
  },
  {
    email: "magasinier@test.sofismart.com",
    name: "Magasinier Test",
    username: "magasinier-test",
    roleCode: "MAGASINIER",
    legacyRole: "DEPOT_MANAGER",
    jobFunction: "MAGASINIER",
    ref: "STG-SAL-0003",
    password: STAGING_PASSWORDS.default,
  },
  {
    email: "comptable@test.sofismart.com",
    name: "Comptable Test",
    username: "comptable-test",
    roleCode: "COMPTABLE",
    legacyRole: "ACCOUNTANT",
    jobFunction: "COMPTABLE",
    ref: "STG-SAL-0004",
    password: STAGING_PASSWORDS.default,
  },
  {
    email: "directeur@test.sofismart.com",
    name: "Directeur Test",
    username: "directeur-test",
    roleCode: "DIRECTEUR",
    legacyRole: "ADMIN",
    jobFunction: "DIRECTEUR",
    ref: "STG-SAL-0005",
    password: STAGING_PASSWORDS.default,
  },
];

const SUPPLIER_NAMES = [
  "Auto Premium Casablanca",
  "Import Motors Tanger",
  "Concession Atlas",
  "Fleet Partners Maroc",
  "Garage Royal Rabat",
  "Euro Auto Import",
  "Sahara Motors",
  "Nord Concession",
  "Sud Automobiles",
  "TransAuto Logistics",
];

const CLIENT_FIRST = [
  "Karim",
  "Salma",
  "Youssef",
  "Nadia",
  "Omar",
  "Leila",
  "Hassan",
  "Imane",
  "Mehdi",
  "Sara",
  "Amine",
  "Fatima",
  "Rachid",
  "Zineb",
  "Khalid",
  "Aya",
  "Samir",
  "Houda",
  "Tarik",
  "Meryem",
];

const BRANDS = [
  { brand: "Renault", models: ["Clio V", "Captur", "Megane IV"] },
  { brand: "Peugeot", models: ["208", "3008", "508"] },
  { brand: "BMW", models: ["Série 3", "X3", "X5"] },
  { brand: "Mercedes-Benz", models: ["Classe A", "GLC", "Classe E"] },
  { brand: "Toyota", models: ["Corolla", "Yaris", "RAV4"] },
];

export async function seedStaging(prisma: PrismaClient) {
  await seedRbac(prisma);
  await seedNotifications(prisma);
  await seedEmails(prisma);

  const passwordHashes = new Map<string, string>();
  for (const u of STAGING_USERS) {
    passwordHashes.set(u.email, await bcrypt.hash(u.password, 12));
  }

  const depotCasa = await prisma.depot.upsert({
    where: { id: "stg-depot-casa" },
    update: {},
    create: {
      id: "stg-depot-casa",
      name: "Dépôt Test Casablanca",
      address: "Zone industrielle TEST, Casablanca",
      city: "Casablanca",
      maxCapacity: 100,
    },
  });

  const depotRabat = await prisma.depot.upsert({
    where: { id: "stg-depot-rabat" },
    update: {},
    create: {
      id: "stg-depot-rabat",
      name: "Dépôt Test Rabat",
      address: "Agdal TEST, Rabat",
      city: "Rabat",
      maxCapacity: 60,
    },
  });

  for (const u of STAGING_USERS) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: u.roleCode },
    });
    const employee = await prisma.employee.upsert({
      where: { reference: u.ref },
      update: { professionalEmail: u.email },
      create: {
        reference: u.ref,
        firstName: u.name.split(" ")[0],
        lastName: u.name.split(" ").slice(1).join(" ") || "Test",
        professionalEmail: u.email,
        jobFunction: u.jobFunction as never,
        status: "ACTIVE",
        hireDate: new Date("2024-01-01"),
      },
    });
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: passwordHashes.get(u.email)!,
        roleId: role.id,
        role: u.legacyRole,
        employeeId: employee.id,
        accountStatus: "ACTIVE",
        name: u.name,
        username: u.username,
      },
      create: {
        email: u.email,
        name: u.name,
        username: u.username,
        passwordHash: passwordHashes.get(u.email)!,
        role: u.legacyRole,
        roleId: role.id,
        employeeId: employee.id,
        accountStatus: "ACTIVE",
      },
    });
  }

  await linkLegacyUsers(prisma);

  const suppliers: { id: string }[] = [];
  for (let i = 0; i < SUPPLIER_NAMES.length; i++) {
    const id = `stg-supplier-${i + 1}`;
    const s = await prisma.supplier.upsert({
      where: { id },
      update: { reference: `STG-FRN-${String(i + 1).padStart(4, "0")}` },
      create: {
        id,
        reference: `STG-FRN-${String(i + 1).padStart(4, "0")}`,
        type: i % 2 === 0 ? "DEALERSHIP" : "IMPORTER",
        name: SUPPLIER_NAMES[i],
        companyName: SUPPLIER_NAMES[i],
        ice: `STG${String(100000000 + i).slice(0, 9)}`,
        phone: `+212600000${String(i).padStart(3, "0")}`,
        email: `fournisseur${i + 1}@test.sofismart.com`,
        city: i % 2 === 0 ? "Casablanca" : "Rabat",
        status: "ACTIVE",
      },
    });
    suppliers.push(s);
  }

  const commercial = await prisma.user.findUniqueOrThrow({
    where: { email: "commercial@test.sofismart.com" },
  });

  const clients: { id: string }[] = [];
  for (let i = 0; i < CLIENT_FIRST.length; i++) {
    const id = `stg-client-${i + 1}`;
    const c = await prisma.client.upsert({
      where: { id },
      update: { reference: `STG-CLI-${String(i + 1).padStart(4, "0")}` },
      create: {
        id,
        reference: `STG-CLI-${String(i + 1).padStart(4, "0")}`,
        type: i % 5 === 0 ? "COMPANY" : "INDIVIDUAL",
        name: `${CLIENT_FIRST[i]} Test ${i + 1}`,
        firstName: CLIENT_FIRST[i],
        lastName: `Test${i + 1}`,
        phone: `+212611${String(100000 + i).slice(-6)}`,
        email: `client${i + 1}@test.sofismart.com`,
        city: i % 3 === 0 ? "Casablanca" : i % 3 === 1 ? "Rabat" : "Marrakech",
        relationshipStatus: "ACTIVE",
        financialStatus: "GOOD_PAYER",
        assignedCommercialId: commercial.id,
      },
    });
    clients.push(c);
  }

  const brandCache = new Map<
    string,
    { id: string; models: Map<string, string> }
  >();
  for (const b of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { label: b.brand },
      update: {},
      create: { label: b.brand },
    });
    const models = new Map<string, string>();
    for (const m of b.models) {
      const model = await prisma.vehicleModel.upsert({
        where: { brandId_label: { brandId: brand.id, label: m } },
        update: {},
        create: { brandId: brand.id, label: m },
      });
      models.set(m, model.id);
    }
    brandCache.set(b.brand, { id: brand.id, models });
  }

  const vehicleIds: string[] = [];
  for (let i = 1; i <= 50; i++) {
    const b = BRANDS[i % BRANDS.length];
    const modelLabel = b.models[i % b.models.length];
    const brandData = brandCache.get(b.brand)!;
    const ref = `STG-V-${String(i).padStart(4, "0")}`;
    const purchasePrice = 140_000 + i * 4_500;
    const fees = 8_000 + (i % 7) * 1_500;
    const costPrice = purchasePrice + fees;
    const targetSalePrice = Math.round(costPrice * 1.12);
    const status = i <= 40 ? "IN_STOCK" : i <= 45 ? "RESERVED" : "IN_STOCK";

    const vehicle = await prisma.vehicle.upsert({
      where: { internalRef: ref },
      update: {},
      create: {
        internalRef: ref,
        brandId: brandData.id,
        modelId: brandData.models.get(modelLabel)!,
        version: `Version Test ${i}`,
        year: 2019 + (i % 6),
        mileage: 5_000 + i * 2_800,
        fuel: i % 3 === 0 ? "ESSENCE" : "DIESEL",
        transmission: "AUTOMATIQUE",
        color: ["Noir", "Blanc", "Gris", "Bleu"][i % 4],
        vin: `STGTEST${String(i).padStart(8, "0")}VIN`,
        plate: `${20000 + i}-T-${i % 99}`,
        origin: i % 3 === 0 ? "IMPORTED" : i % 3 === 1 ? "USED" : "NEW",
        purchasePrice,
        extraFeesTotal: fees,
        costPrice,
        targetSalePrice,
        finalSalePrice: null,
        status,
        depotId: i % 2 === 0 ? depotCasa.id : depotRabat.id,
      },
    });
    vehicleIds.push(vehicle.id);
  }

  for (let i = 0; i < 10; i++) {
    const vehicleId = vehicleIds[i];
    await prisma.purchase.upsert({
      where: { vehicleId },
      update: {},
      create: {
        reference: `STG-ACH-${String(i + 1).padStart(4, "0")}`,
        vehicleId,
        supplierId: suppliers[i % suppliers.length].id,
        purchaseDate: new Date(2025, i % 12, 10),
        status: "VALIDATED",
        amountHT: 140_000 + i * 4_500,
        amountTTC: 140_000 + i * 4_500,
        totalPurchasePrice: 140_000 + i * 4_500,
        totalExpenses: 8_000,
        costPrice: 148_000 + i * 4_500,
        basePrice: 140_000 + i * 4_500,
        advancePaid: 140_000 + i * 4_500,
        paymentStatus: "PAID",
        paymentMethod: "TRANSFER",
        fees: {
          create: [
            { type: "TRANSPORT", amount: 5000 },
            { type: "CLEANING", amount: 3000 },
          ],
        },
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const vehicleId = vehicleIds[40 + i];
    const existing = await prisma.sale.findUnique({ where: { vehicleId } });
    if (existing) continue;
    const finalPrice = (200_000 + i * 8_000) * 1.2 - (i % 2 === 0 ? 1000 : 0);
    await prisma.sale.create({
      data: {
        reference: `STG-VTE-${String(i + 1).padStart(4, "0")}`,
        vehicleId,
        clientId: clients[i % clients.length].id,
        commercialId: commercial.id,
        saleDate: new Date(2026, i % 6, 15),
        price: 200_000 + i * 8_000,
        discount: i % 2 === 0 ? 1000 : 0,
        taxAmount: (200_000 + i * 8_000) * 0.2,
        finalPrice,
        margin: 15_000 + i * 500,
        advanceReceived: finalPrice,
        paymentStatus: i % 3 === 0 ? "PARTIAL" : "PAID",
        paymentMethod: "TRANSFER",
        status: i % 4 === 0 ? "DRAFT" : "VALIDATED",
        payments: {
          create: [
            {
              amount: 100_000,
              method: "TRANSFER",
              direction: "FROM_CLIENT",
              paidAt: new Date(2026, i % 6, 10),
            },
          ],
        },
      },
    });
    if (i % 4 !== 0) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "SOLD", finalSalePrice: finalPrice },
      });
    }
  }

  await prisma.companyProfile.upsert({
    where: { id: "default" },
    update: {
      legalName: "SOFISMART TEST SARL",
      tradeName: "SOFISMART TEST",
      email: "contact@test.sofismart.com",
    },
    create: {
      id: "default",
      legalName: "SOFISMART TEST SARL",
      tradeName: "SOFISMART TEST",
      country: "Maroc",
      city: "Casablanca",
      phone: "+212 5 22 00 00 00",
      email: "contact@test.sofismart.com",
    },
  });

  console.log("\n——— SOFISMART STAGING SEED ———");
  console.log(
    "  10 fournisseurs | 20 clients | 50 véhicules | 10 achats | 10 ventes",
  );
  console.log("\n  Comptes (@test.sofismart.com) :");
  for (const u of STAGING_USERS) {
    console.log(`    ${u.email}  /  ${u.password}  (${u.roleCode})`);
  }
  console.log("");
}
