import { prisma } from "@/lib/prisma";
import { DepotsManager } from "@/components/settings/depots-manager";
import {
  depotsCrudFlags,
  requireSettingsPageAccess,
} from "@/lib/rbac/settings-page-auth";

export default async function SettingsDepotsPage() {
  const perms = await requireSettingsPageAccess("depots.view");
  const flags = depotsCrudFlags(perms);

  const managers = await prisma.user.findMany({
    where: { accountStatus: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return <DepotsManager managers={managers} {...flags} />;
}
