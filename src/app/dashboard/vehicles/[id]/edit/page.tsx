import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VehicleWizard } from "@/components/vehicles/vehicle-wizard";
import { buildVehicleWizardValues } from "@/lib/vehicle-wizard-data";
import { catalogFromVehicle } from "@/lib/vehicle-catalog";
import { getFinancialAccessFromSession } from "@/lib/server/financial-access-session";

type Props = { params: Promise<{ id: string }> };

export default async function EditVehiclePage({ params }: Props) {
  const { id } = await params;
  const financial = await getFinancialAccessFromSession();
  const canViewFinancials = financial?.canViewFinancials ?? false;
  const [vehicle, depots] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id },
      include: {
        brand: true,
        carModel: true,
        documents: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.depot.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!vehicle) notFound();
  if (vehicle.isArchived) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <p className="text-sm text-morocco-700">Ce véhicule est archivé et ne peut plus être modifié.</p>
        <Link href={`/dashboard/vehicles/${id}`} className="text-sm text-gold-700 hover:underline">
          ← Retour à la fiche
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/vehicles/${id}`}
        className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-950"
      >
        <ChevronLeft className="h-4 w-4" /> Fiche véhicule
      </Link>
      <div>
        <h2 className="font-display text-3xl text-navy-950">Modifier le véhicule</h2>
        <p className="mt-1 font-mono text-sm text-navy-600">{vehicle.internalRef}</p>
      </div>
      <VehicleWizard
        depots={depots}
        vehicleId={vehicle.id}
        initialValues={buildVehicleWizardValues(vehicle)}
        initialCatalog={catalogFromVehicle(vehicle)}
        mode="edit"
        canViewFinancials={canViewFinancials}
      />
    </div>
  );
}
