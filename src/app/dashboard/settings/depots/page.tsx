import { prisma } from "@/lib/prisma";
import { DepotsManager } from "@/components/settings/depots-manager";

export default async function SettingsDepotsPage() {
  const managers = await prisma.user.findMany({
    where: { accountStatus: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return <DepotsManager managers={managers} />;
}
