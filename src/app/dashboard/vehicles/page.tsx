import { prisma } from "@/lib/prisma";
import { VehiclesList } from "@/components/vehicles/vehicles-list";
import { DatabaseUnavailable } from "@/components/dashboard/database-unavailable";
import { listVehiclesForUi, serializeVehiclesForList } from "@/lib/vehicles-list-query";
import { getFinancialAccessFromSession } from "@/lib/server/financial-access-session";
import { databaseConnectionMessage, isDatabaseConnectionError } from "@/lib/prisma-errors";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const financial = await getFinancialAccessFromSession();
  const canViewFinancials = financial?.canViewFinancials ?? false;

  let depots: { id: string; name: string }[] = [];
  let initialRows: Awaited<ReturnType<typeof serializeVehiclesForList>> = [];
  let loadError: string | null = null;

  try {
    const [depotRows, vehicles] = await Promise.all([
      prisma.depot.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      listVehiclesForUi(),
    ]);
    depots = depotRows;
    initialRows = serializeVehiclesForList(vehicles, canViewFinancials);
  } catch (err) {
    console.error("[vehicles/page]", err);
    if (isDatabaseConnectionError(err)) {
      loadError = databaseConnectionMessage(err);
    } else {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      loadError =
        msg.includes("isArchived") || msg.includes("DATABASE_URL")
          ? `${msg} — Exécutez : npm run db:push puis redémarrez npm run dev`
          : `Erreur lors du chargement : ${msg}`;
    }
  }

  return (
    <div className="space-y-6">
      {loadError && <DatabaseUnavailable message={loadError} />}
      <VehiclesList depots={depots} initialRows={initialRows} canViewFinancials={canViewFinancials} />
    </div>
  );
}
