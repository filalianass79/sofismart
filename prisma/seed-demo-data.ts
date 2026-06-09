import type { PrismaClient } from "../src/generated/prisma/client";

type SeedContext = {
  prisma: PrismaClient;
  passwordHash: string;
  depotCasaId: string;
  depotRabatId: string;
};

type VehicleSeed = {
  ref: string;
  achRef: string;
  brandLabel: string;
  modelLabel: string;
  version: string;
  year: number;
  mileage: number;
  fuel: "DIESEL" | "ESSENCE" | "HYBRIDE";
  color: string;
  vin: string;
  plate: string;
  origin: "NEW" | "USED" | "IMPORTED";
  depotId: string;
  supplierKey: string;
  purchasePrice: number;
  fees: {
    type: "TRANSPORT" | "CUSTOMS" | "CLEANING" | "REGISTRATION" | "OTHER";
    amount: number;
  }[];
  targetSalePrice: number;
  purchaseDate: string;
  status?: "IN_STOCK" | "PREPARATION" | "RESERVED";
};

/** Nombre d’achats véhicules seed pour tester les ventes (statut VALIDATED, stock disponible). */
export const SALES_TEST_PURCHASE_COUNT = 30;

/** Véhicules + achats générés (ex. V-2026-0003 → 0032 pour startIndex=3, count=30). */
function buildSalesTestVehicles(
  depotCasaId: string,
  depotRabatId: string,
  startIndex: number,
  count: number,
): VehicleSeed[] {
  const catalog: Pick<
    VehicleSeed,
    "brandLabel" | "modelLabel" | "version" | "fuel"
  >[] = [
    {
      brandLabel: "BMW",
      modelLabel: "Série 3",
      version: "320d M Sport",
      fuel: "DIESEL",
    },
    {
      brandLabel: "BMW",
      modelLabel: "X3",
      version: "xDrive20d",
      fuel: "DIESEL",
    },
    {
      brandLabel: "Renault",
      modelLabel: "Clio V",
      version: "Intens TCe 90",
      fuel: "ESSENCE",
    },
    {
      brandLabel: "Renault",
      modelLabel: "Captur",
      version: "Zen TCe 140",
      fuel: "ESSENCE",
    },
    {
      brandLabel: "Peugeot",
      modelLabel: "3008",
      version: "GT Line 1.5 BlueHDi",
      fuel: "DIESEL",
    },
    {
      brandLabel: "Peugeot",
      modelLabel: "208",
      version: "GT 1.2 PureTech 130",
      fuel: "ESSENCE",
    },
    {
      brandLabel: "Toyota",
      modelLabel: "Corolla",
      version: "1.8 Hybrid Lounge",
      fuel: "HYBRIDE",
    },
    {
      brandLabel: "Toyota",
      modelLabel: "RAV4",
      version: "Hybrid Dynamic 2WD",
      fuel: "HYBRIDE",
    },
    {
      brandLabel: "Volkswagen",
      modelLabel: "Golf 8",
      version: "1.5 TSI Style",
      fuel: "ESSENCE",
    },
    {
      brandLabel: "Mercedes-Benz",
      modelLabel: "GLC",
      version: "220 d 4Matic",
      fuel: "DIESEL",
    },
    {
      brandLabel: "Audi",
      modelLabel: "A4",
      version: "35 TDI S line",
      fuel: "DIESEL",
    },
    {
      brandLabel: "Mercedes-Benz",
      modelLabel: "Classe E",
      version: "220 d AMG Line",
      fuel: "DIESEL",
    },
  ];
  const colors = ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Argent", "Beige"];
  const origins: VehicleSeed["origin"][] = ["USED", "NEW", "IMPORTED"];
  const supplierKeys = [
    "seed-supplier-1",
    "seed-supplier-2",
    "seed-supplier-3",
    "seed-supplier-4",
    "seed-supplier-5",
    "seed-supplier-6",
  ];

  return Array.from({ length: count }, (_, i) => {
    const seq = startIndex + i;
    const ref = `V-2026-${String(seq).padStart(4, "0")}`;
    const combo = catalog[i % catalog.length];
    const origin = origins[i % origins.length];
    const purchasePrice = 155_000 + (i % 12) * 22_500;
    const fees =
      origin === "IMPORTED"
        ? [
            { type: "CUSTOMS" as const, amount: 12_000 + (i % 5) * 2_000 },
            { type: "TRANSPORT" as const, amount: 6_000 },
          ]
        : origin === "NEW"
          ? [{ type: "REGISTRATION" as const, amount: 4_500 }]
          : [
              { type: "CLEANING" as const, amount: 2_000 },
              { type: "TRANSPORT" as const, amount: 3_500 },
            ];
    const feesTotal = fees.reduce((a, f) => a + f.amount, 0);
    const targetSalePrice = Math.round((purchasePrice + feesTotal) * 1.14);

    return {
      ref,
      achRef: `ACH-2026-${String(200 + seq).padStart(4, "0")}`,
      ...combo,
      year: 2021 + (i % 4),
      mileage: 5_000 + i * 3_200,
      color: colors[i % colors.length],
      vin: `SEED${String(seq).padStart(6, "0")}VIN${String(i).padStart(4, "0")}`,
      plate: `${String(10000 + seq)}-${i % 2 === 0 ? "A" : "B"}-${seq % 100}`,
      origin,
      depotId: i % 2 === 0 ? depotCasaId : depotRabatId,
      supplierKey: supplierKeys[i % supplierKeys.length],
      purchasePrice,
      fees,
      targetSalePrice,
      purchaseDate: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
      status:
        i === 2 ? "PREPARATION" : i === 10 ? "RESERVED" : ("IN_STOCK" as const),
    };
  });
}

/** Données de démo : salariés, fournisseurs, clients, achats véhicules disponibles à la vente */
export async function seedDemoData(ctx: SeedContext) {
  const { prisma, passwordHash, depotCasaId, depotRabatId } = ctx;

  const commercialRole = await prisma.role.findUniqueOrThrow({
    where: { code: "COMMERCIAL" },
  });
  const gerantRole = await prisma.role.findUniqueOrThrow({
    where: { code: "GERANT" },
  });
  const comptableRole = await prisma.role.findUniqueOrThrow({
    where: { code: "COMPTABLE" },
  });
  const magasinierRole = await prisma.role.findUniqueOrThrow({
    where: { code: "MAGASINIER" },
  });

  const commercialUser = await prisma.user.findUniqueOrThrow({
    where: { email: "commercial@sofismart.com" },
  });

  // ——— Salariés & comptes ———
  const employees = [
    {
      reference: "SAL-2026-0003",
      firstName: "Karim",
      lastName: "Bennani",
      email: "gerant@sofismart.com",
      username: "gerant",
      roleId: gerantRole.id,
      role: "COMMERCIAL" as const,
      jobFunction: "GERANT" as const,
      department: "Direction",
    },
    {
      reference: "SAL-2026-0004",
      firstName: "Sanae",
      lastName: "Alaoui",
      email: "comptable@sofismart.com",
      username: "comptable",
      roleId: comptableRole.id,
      role: "ACCOUNTANT" as const,
      jobFunction: "COMPTABLE" as const,
      department: "Finance",
    },
    {
      reference: "SAL-2026-0005",
      firstName: "Youssef",
      lastName: "Tazi",
      email: "magasin@sofismart.com",
      username: "magasin",
      roleId: magasinierRole.id,
      role: "DEPOT_MANAGER" as const,
      jobFunction: "MAGASINIER" as const,
      department: "Logistique",
      depotId: depotCasaId,
    },
    {
      reference: "SAL-2026-0006",
      firstName: "Nadia",
      lastName: "Idrissi",
      email: "commercial2@sofismart.com",
      username: "commercial2",
      roleId: commercialRole.id,
      role: "COMMERCIAL" as const,
      jobFunction: "COMMERCIAL" as const,
      department: "Ventes",
    },
  ];

  for (const e of employees) {
    const emp = await prisma.employee.upsert({
      where: { reference: e.reference },
      update: {
        firstName: e.firstName,
        lastName: e.lastName,
        jobFunction: e.jobFunction,
        department: e.department,
        depotId: e.depotId ?? null,
        status: "ACTIVE",
      },
      create: {
        reference: e.reference,
        firstName: e.firstName,
        lastName: e.lastName,
        professionalEmail: e.email,
        phone: "+212600" + e.reference.slice(-6),
        jobFunction: e.jobFunction,
        department: e.department,
        depotId: e.depotId ?? null,
        hireDate: new Date("2022-06-01"),
        status: "ACTIVE",
      },
    });

    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {
        passwordHash,
        roleId: e.roleId,
        employeeId: emp.id,
        depotId: e.depotId ?? null,
        accountStatus: "ACTIVE",
      },
      create: {
        email: e.email,
        name: `${e.firstName} ${e.lastName}`,
        username: e.username,
        passwordHash,
        role: e.role,
        roleId: e.roleId,
        employeeId: emp.id,
        depotId: e.depotId ?? null,
        accountStatus: "ACTIVE",
      },
    });

    if (e.email === "magasin@sofismart.com") {
      await prisma.depot.update({
        where: { id: depotCasaId },
        data: { managerId: user.id },
      });
    }
  }

  // ——— Fournisseurs ———
  const suppliersData = [
    {
      id: "seed-supplier-2",
      reference: "FRN-2026-0102",
      type: "IMPORTER" as const,
      name: "Import Auto Europe",
      companyName: "Import Auto Europe SARL",
      ice: "002345678000012",
      city: "Tanger",
      phone: "+212 539 94 00 00",
    },
    {
      id: "seed-supplier-3",
      reference: "FRN-2026-0103",
      type: "DEALERSHIP" as const,
      name: "BMW Premium Maroc",
      companyName: "BMW Premium Maroc",
      ice: "003456789000023",
      city: "Casablanca",
      phone: "+212 522 45 67 89",
    },
    {
      id: "seed-supplier-4",
      reference: "FRN-2026-0104",
      type: "GARAGE" as const,
      name: "Garage Atlas Motors",
      companyName: "Atlas Motors",
      ice: "004567890000034",
      city: "Marrakech",
      phone: "+212 524 33 22 11",
    },
    {
      id: "seed-supplier-5",
      reference: "FRN-2026-0105",
      type: "COMPANY" as const,
      name: "Renault Retail Group",
      companyName: "Renault Retail Group Maroc",
      ice: "005678901000045",
      city: "Rabat",
      phone: "+212 537 70 80 90",
    },
    {
      id: "seed-supplier-6",
      reference: "FRN-2026-0106",
      type: "INDIVIDUAL" as const,
      name: "Mohamed Cherkaoui",
      firstName: "Mohamed",
      lastName: "Cherkaoui",
      cin: "CD789012",
      city: "Fès",
      phone: "+212661112233",
    },
  ];

  const supplierIds: Record<string, string> = {
    "seed-supplier-1": "seed-supplier-1",
  };

  for (const s of suppliersData) {
    const row = await prisma.supplier.upsert({
      where: { id: s.id },
      update: {
        reference: s.reference,
        name: s.name,
        companyName: s.companyName ?? s.name,
        ice: s.ice ?? null,
        cin: "cin" in s ? s.cin : null,
        city: s.city,
        phone: s.phone,
        status: "ACTIVE",
      },
      create: {
        id: s.id,
        reference: s.reference,
        type: s.type,
        name: s.name,
        companyName: s.companyName ?? null,
        firstName: "firstName" in s ? s.firstName : null,
        lastName: "lastName" in s ? s.lastName : null,
        ice: s.ice ?? null,
        cin: "cin" in s ? s.cin : null,
        city: s.city,
        phone: s.phone,
        email: `contact+${s.reference.toLowerCase()}@demo.ma`,
        country: "Maroc",
        status: "ACTIVE",
      },
    });
    supplierIds[s.id] = row.id;
  }

  const s1 = await prisma.supplier.findUniqueOrThrow({
    where: { id: "seed-supplier-1" },
  });
  supplierIds["seed-supplier-1"] = s1.id;

  // ——— Clients ———
  const clientsData = [
    {
      id: "seed-client-2",
      reference: "CLI-2026-0102",
      type: "INDIVIDUAL" as const,
      name: "Ahmed Benjelloun",
      firstName: "Ahmed",
      lastName: "Benjelloun",
      cin: "BE234567",
      city: "Casablanca",
      financialStatus: "GOOD_PAYER" as const,
    },
    {
      id: "seed-client-3",
      reference: "CLI-2026-0103",
      type: "INDIVIDUAL" as const,
      name: "Fatima Zahra El Amrani",
      firstName: "Fatima Zahra",
      lastName: "El Amrani",
      cin: "FA345678",
      city: "Rabat",
      financialStatus: "GOOD_PAYER" as const,
    },
    {
      id: "seed-client-4",
      reference: "CLI-2026-0104",
      type: "COMPANY" as const,
      name: "Transports Atlas SARL",
      companyName: "Transports Atlas SARL",
      ice: "101234567000091",
      city: "Casablanca",
      financialStatus: "AVERAGE" as const,
    },
    {
      id: "seed-client-5",
      reference: "CLI-2026-0105",
      type: "COMPANY" as const,
      name: "Holding Marrakech Motors",
      companyName: "Holding Marrakech Motors",
      ice: "102345678000092",
      city: "Marrakech",
      financialStatus: "GOOD_PAYER" as const,
    },
    {
      id: "seed-client-6",
      reference: "CLI-2026-0106",
      type: "RESELLER" as const,
      name: "Auto Pro Fès",
      companyName: "Auto Pro Fès",
      ice: "103456789000093",
      city: "Fès",
      financialStatus: "GOOD_PAYER" as const,
    },
    {
      id: "seed-client-7",
      reference: "CLI-2026-0107",
      type: "INDIVIDUAL" as const,
      name: "Hassan Ouali",
      firstName: "Hassan",
      lastName: "Ouali",
      cin: "HO456789",
      city: "Tanger",
      financialStatus: "RISK" as const,
      outstandingAmount: 45000,
    },
    {
      id: "seed-client-8",
      reference: "CLI-2026-0108",
      type: "INDIVIDUAL" as const,
      name: "Leila Mansouri",
      firstName: "Leila",
      lastName: "Mansouri",
      cin: "LM567890",
      city: "Agadir",
      financialStatus: "GOOD_PAYER" as const,
    },
    {
      id: "seed-client-9",
      reference: "CLI-2026-0109",
      type: "COMPANY" as const,
      name: "Société BTP Oued Zem",
      companyName: "Société BTP Oued Zem",
      ice: "104567890000094",
      city: "Khémisset",
      financialStatus: "AVERAGE" as const,
    },
    {
      id: "seed-client-10",
      reference: "CLI-2026-0110",
      type: "INDIVIDUAL" as const,
      name: "Rachid Lamrani",
      firstName: "Rachid",
      lastName: "Lamrani",
      cin: "RL678901",
      city: "Casablanca",
      financialStatus: "GOOD_PAYER" as const,
    },
  ];

  for (const c of clientsData) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {
        reference: c.reference,
        name: c.name,
        assignedCommercialId: commercialUser.id,
        relationshipStatus: "ACTIVE",
        financialStatus: c.financialStatus,
        outstandingAmount: "outstandingAmount" in c ? c.outstandingAmount : 0,
      },
      create: {
        id: c.id,
        reference: c.reference,
        type: c.type,
        name: c.name,
        firstName: "firstName" in c ? c.firstName : null,
        lastName: "lastName" in c ? c.lastName : null,
        companyName: "companyName" in c ? c.companyName : null,
        cin: "cin" in c ? c.cin : null,
        ice: "ice" in c ? c.ice : null,
        phone: "+2126" + c.reference.replace(/\D/g, "").slice(-8),
        email: `${c.reference.toLowerCase()}@client-demo.ma`,
        city: c.city,
        country: "Maroc",
        assignedCommercialId: commercialUser.id,
        relationshipStatus: "ACTIVE",
        financialStatus: c.financialStatus,
        outstandingAmount: "outstandingAmount" in c ? c.outstandingAmount : 0,
      },
    });
  }

  // ——— Catalogue ———
  const brands = await Promise.all(
    ["BMW", "Renault", "Peugeot", "Toyota", "Volkswagen"].map((label) =>
      prisma.brand.upsert({ where: { label }, update: {}, create: { label } }),
    ),
  );
  const brandMap = Object.fromEntries(brands.map((b) => [b.label, b.id]));

  const mercedes = await prisma.brand.findUniqueOrThrow({
    where: { label: "Mercedes-Benz" },
  });
  const audi = await prisma.brand.findUniqueOrThrow({
    where: { label: "Audi" },
  });

  const models: { brandLabel: string; label: string }[] = [
    { brandLabel: "BMW", label: "Série 3" },
    { brandLabel: "BMW", label: "X3" }, // utilisé par le lot +20 véhicules test vente
    { brandLabel: "Renault", label: "Clio V" },
    { brandLabel: "Renault", label: "Captur" },
    { brandLabel: "Peugeot", label: "3008" },
    { brandLabel: "Peugeot", label: "208" },
    { brandLabel: "Toyota", label: "Corolla" },
    { brandLabel: "Toyota", label: "RAV4" },
    { brandLabel: "Volkswagen", label: "Golf 8" },
    { brandLabel: "Mercedes-Benz", label: "GLC" },
    { brandLabel: "Audi", label: "A4" },
  ];

  const modelMap: Record<string, string> = {};
  for (const m of models) {
    const brandId =
      m.brandLabel === "Mercedes-Benz"
        ? mercedes.id
        : m.brandLabel === "Audi"
          ? audi.id
          : brandMap[m.brandLabel];
    const row = await prisma.vehicleModel.upsert({
      where: { brandId_label: { brandId, label: m.label } },
      update: {},
      create: { brandId, label: m.label },
    });
    modelMap[`${m.brandLabel}|${m.label}`] = row.id;
  }

  const classeE = await prisma.vehicleModel.findUniqueOrThrow({
    where: { brandId_label: { brandId: mercedes.id, label: "Classe E" } },
  });
  modelMap["Mercedes-Benz|Classe E"] = classeE.id;

  // ——— 30 achats véhicules (VALIDATED / PAID) pour tests de vente ———
  const vehicles = buildSalesTestVehicles(
    depotCasaId,
    depotRabatId,
    3,
    SALES_TEST_PURCHASE_COUNT,
  );

  for (const v of vehicles) {
    const brandId =
      v.brandLabel === "Mercedes-Benz"
        ? mercedes.id
        : v.brandLabel === "Audi"
          ? audi.id
          : brandMap[v.brandLabel];
    const modelId = modelMap[`${v.brandLabel}|${v.modelLabel}`];
    const feesTotal = v.fees.reduce((a, f) => a + f.amount, 0);
    const costPrice = v.purchasePrice + feesTotal;
    const supplierId = supplierIds[v.supplierKey];

    const vehicle = await prisma.vehicle.upsert({
      where: { internalRef: v.ref },
      update: {
        status: v.status ?? "IN_STOCK",
        targetSalePrice: v.targetSalePrice,
        costPrice,
        purchasePrice: v.purchasePrice,
        extraFeesTotal: feesTotal,
      },
      create: {
        internalRef: v.ref,
        brandId,
        modelId,
        version: v.version,
        year: v.year,
        mileage: v.mileage,
        fuel: v.fuel,
        transmission: "AUTOMATIQUE",
        color: v.color,
        vin: v.vin,
        plate: v.plate,
        origin: v.origin,
        purchasePrice: v.purchasePrice,
        extraFeesTotal: feesTotal,
        costPrice,
        targetSalePrice: v.targetSalePrice,
        status: v.status ?? "IN_STOCK",
        depotId: v.depotId,
        conditionNotes: "Véhicule seed — données de test",
      },
    });

    await prisma.purchase.upsert({
      where: { vehicleId: vehicle.id },
      update: {
        reference: v.achRef,
        supplierId,
        status: "VALIDATED",
        paymentStatus: "PAID",
        costPrice,
        totalExpenses: feesTotal,
        totalPurchasePrice: v.purchasePrice,
      },
      create: {
        reference: v.achRef,
        vehicleId: vehicle.id,
        supplierId,
        purchaseDate: new Date(v.purchaseDate),
        invoiceDate: new Date(v.purchaseDate),
        purchaseType: v.origin === "IMPORTED" ? "IMPORT" : "LOCAL",
        status: "VALIDATED",
        amountHT: v.purchasePrice,
        taxAmount: 0,
        amountTTC: v.purchasePrice,
        totalPurchasePrice: v.purchasePrice,
        totalExpenses: feesTotal,
        costPrice,
        basePrice: v.purchasePrice,
        advancePaid: v.purchasePrice,
        paymentStatus: "PAID",
        paymentMethod: "TRANSFER",
        invoiceNumber: `FA-${v.achRef}`,
        fees: { create: v.fees },
      },
    });
  }

  const firstRef = vehicles[0]?.ref ?? "—";
  const lastRef = vehicles[vehicles.length - 1]?.ref ?? "—";
  console.log(
    `✓ Données démo : 4 salariés, 6 fournisseurs, 9 clients, ${vehicles.length} achats véhicules (${firstRef} → ${lastRef}, tests vente)`,
  );
}
