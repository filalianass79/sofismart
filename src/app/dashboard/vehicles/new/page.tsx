import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VehicleWizard } from "@/components/vehicles/vehicle-wizard";
import { getFinancialAccessFromSession } from "@/lib/server/financial-access-session";

export default async function NewVehiclePage() {
  const financial = await getFinancialAccessFromSession();
  const canViewFinancials = financial?.canViewFinancials ?? false;
  const depots = await prisma.depot
    .findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
    .catch(() => []);
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/vehicles"
        className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-950"
      >
        <ChevronLeft className="h-4 w-4" /> Retour aux véhicules
      </Link>
      <div>
        <h2 className="font-display text-3xl text-navy-950">Nouveau véhicule</h2>
        <p className="mt-1 text-sm text-navy-600">Assistant en 4 étapes — identification, tarification, documents</p>
      </div>
      <VehicleWizard depots={depots} mode="create" canViewFinancials={canViewFinancials} />
    </div>
  );
}
