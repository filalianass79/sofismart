import { WarehouseDashboard } from "@/components/warehouse/warehouse-dashboard";

export default function DashboardWarehousePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-navy-950">Magasin & livraisons</h2>
        <p className="text-sm text-navy-600">Gestion des sorties, bons de livraison et historique</p>
      </div>
      <WarehouseDashboard />
    </div>
  );
}

