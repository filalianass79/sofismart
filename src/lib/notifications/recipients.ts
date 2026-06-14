import { prisma } from "@/lib/prisma";

export type RecipientUser = {
  id: string;
  name: string | null;
  phone: string | null;
  whatsappOptIn: boolean;
  whatsappEnabled: boolean;
  internalEnabled: boolean;
};

function mapUser(u: {
  id: string;
  name: string | null;
  employee: {
    phone: string | null;
    whatsappPhone?: string | null;
    whatsappEnabled?: boolean;
    whatsappConsent?: boolean;
  } | null;
  notificationPreferences: {
    phoneOverride: string | null;
    whatsappOptIn: boolean;
    whatsappEnabled: boolean;
    internalEnabled: boolean;
  } | null;
}): RecipientUser {
  const prefs = u.notificationPreferences;
  return {
    id: u.id,
    name: u.name,
    phone: prefs?.phoneOverride ?? u.employee?.whatsappPhone ?? u.employee?.phone ?? null,
    whatsappOptIn: prefs?.whatsappOptIn ?? false,
    whatsappEnabled: prefs?.whatsappEnabled ?? true,
    internalEnabled: prefs?.internalEnabled ?? true,
  };
}

export async function findUsersByRoleCodes(codes: string[]): Promise<RecipientUser[]> {
  if (!codes.length) return [];
  const users = await prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      OR: [
        { appRole: { code: { in: codes } } },
        ...(codes.includes("ADMIN") ? [{ role: "ADMIN" as const }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      employee: { select: { phone: true, whatsappPhone: true, whatsappEnabled: true, whatsappConsent: true } },
      notificationPreferences: true,
    },
  });
  return users.map(mapUser);
}

export async function findWarehouseUsersForDepot(depotId: string): Promise<RecipientUser[]> {
  const users = await prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      AND: [
        {
          OR: [
            { depotId },
            { employee: { depotId } },
            { managedDepots: { some: { id: depotId } } },
          ],
        },
        {
          OR: [
            { appRole: { code: { in: ["MAGASINIER", "RESPONSABLE_DEPOT", "GERANT", "ADMIN"] } } },
            { role: "ADMIN" },
            { role: "DEPOT_MANAGER" },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      employee: { select: { phone: true, whatsappPhone: true, whatsappEnabled: true, whatsappConsent: true } },
      notificationPreferences: true,
    },
  });
  return users.map(mapUser);
}

export async function resolveUserPhone(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      employee: { select: { phone: true, whatsappPhone: true, whatsappEnabled: true, whatsappConsent: true } },
      notificationPreferences: { select: { phoneOverride: true } },
    },
  });
  const raw = u?.notificationPreferences?.phoneOverride ?? u?.employee?.whatsappPhone ?? u?.employee?.phone ?? null;
  const { normalizePhone } = await import("./phone");
  return normalizePhone(raw);
}
