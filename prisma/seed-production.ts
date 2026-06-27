import bcrypt from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";
import { linkLegacyUsers, seedRbac } from "./seed-rbac";
import { seedNotifications } from "./seed-notifications";
import { seedEmails } from "./seed-emails";
import { seedCashCategories } from "./seed-treasury";

/**
 * Seed minimal production : RBAC + admin initial (via variables d'environnement).
 */
export async function seedProduction(prisma: PrismaClient) {
  await seedRbac(prisma);
  await seedNotifications(prisma);
  await seedEmails(prisma);
  await seedCashCategories(prisma);

  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@sofismart.com")
    .toLowerCase()
    .trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD requis (min. 12 caractères) pour le seed production.",
    );
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: "ADMIN" },
  });
  const hash = await bcrypt.hash(password, 12);
  const displayName = process.env.SEED_ADMIN_NAME ?? "Administrateur SOFISMART";

  await prisma.companyProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      legalName: "SOFISMART SARL",
      tradeName: "SOFISMART",
      country: "Maroc",
      city: "Casablanca",
    },
  });

  const employee = await prisma.employee.upsert({
    where: { reference: "SAL-PROD-0001" },
    update: { professionalEmail: email },
    create: {
      reference: "SAL-PROD-0001",
      firstName: displayName.split(" ")[0] ?? "Admin",
      lastName: displayName.split(" ").slice(1).join(" ") || "SOFISMART",
      professionalEmail: email,
      jobFunction: "ADMINISTRATEUR",
      department: "Direction",
      status: "ACTIVE",
      hireDate: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      role: "ADMIN",
      roleId: adminRole.id,
      employeeId: employee.id,
      accountStatus: "ACTIVE",
      passwordMustChange: false,
      name: displayName,
    },
    create: {
      email,
      name: displayName,
      username: email.split("@")[0] ?? "admin",
      passwordHash: hash,
      role: "ADMIN",
      roleId: adminRole.id,
      employeeId: employee.id,
      accountStatus: "ACTIVE",
    },
  });

  await linkLegacyUsers(prisma);

  console.log(`✓ Seed production : RBAC + administrateur ${email}`);
}
