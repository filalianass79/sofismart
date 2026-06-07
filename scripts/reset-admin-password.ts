/**
 * Réinitialise ou crée le compte administrateur SOFISMART.
 *
 * Usage :
 *   npm run admin:reset
 *   SEED_ADMIN_EMAIL=admin@sofismart.ma SEED_ADMIN_PASSWORD=VotreMotDePasse12! npm run admin:reset
 */
import dotenv from "dotenv";
dotenv.config({ override: true });

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@sofismart.ma").toLowerCase().trim();
const password = process.env.SEED_ADMIN_PASSWORD ?? "AdminSofi2026!";
const displayName = process.env.SEED_ADMIN_NAME ?? "Administrateur SOFISMART";

async function main() {
  if (password.length < 12) {
    console.error("Erreur : le mot de passe doit contenir au moins 12 caractères.");
    console.error("Exemple : SEED_ADMIN_PASSWORD=MonNouveauPass2026! npm run admin:reset");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("Erreur : DATABASE_URL manquant dans .env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    let adminRole = await prisma.role.findUnique({ where: { code: "ADMIN" } });
    if (!adminRole) {
      console.log("Rôle ADMIN absent — exécution du seed RBAC…");
      const { seedRbac } = await import("../prisma/seed-rbac");
      await seedRbac(prisma);
      adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
    }

    const hash = await bcrypt.hash(password, 12);
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash: hash,
          role: "ADMIN",
          roleId: adminRole.id,
          accountStatus: "ACTIVE",
          passwordMustChange: false,
          name: displayName,
        },
      });
      console.log("");
      console.log("✓ Mot de passe administrateur réinitialisé");
      console.log("  Email        :", email);
      console.log("  Mot de passe :", password);
      console.log("");
      return;
    }

    let employee =
      (await prisma.employee.findFirst({
        where: { OR: [{ professionalEmail: email }, { reference: "SAL-2026-0001" }] },
      })) ??
      (await prisma.employee.create({
        data: {
          reference: `SAL-ADMIN-${Date.now()}`,
          firstName: displayName.split(" ")[0] ?? "Admin",
          lastName: displayName.split(" ").slice(1).join(" ") || "SOFISMART",
          professionalEmail: email,
          jobFunction: "ADMINISTRATEUR",
          department: "Direction",
          status: "ACTIVE",
          hireDate: new Date(),
        },
      }));

    await prisma.user.create({
      data: {
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

    console.log("");
    console.log("✓ Compte administrateur créé");
    console.log("  Email        :", email);
    console.log("  Mot de passe :", password);
    console.log("");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
