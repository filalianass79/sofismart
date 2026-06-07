import { Suspense } from "react";
import { SalesList } from "@/components/sales/sales-list";
import { LoadingState } from "@/components/ui/loading";
import { getFinancialAccessFromSession } from "@/lib/server/financial-access-session";

export default async function SalesPage() {
  const financial = await getFinancialAccessFromSession();
  const canViewFinancials = financial?.canViewFinancials ?? false;

  return (
    <Suspense fallback={<LoadingState label="Chargement des ventes…" />}>
      <SalesList canViewFinancials={canViewFinancials} />
    </Suspense>
  );
}
