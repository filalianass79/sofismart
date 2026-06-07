import type { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requirePermissionFresh } from "@/lib/api-auth";
import { resolveWarehousePermission } from "@/lib/warehouse/permissions";
import { getWarehouseDepotScope, type WarehouseDepotScope } from "@/lib/warehouse/depot-scope";

export async function requireWarehousePermission(warehouseKey: string) {
  return requirePermissionFresh(resolveWarehousePermission(warehouseKey));
}

export type WarehouseSessionResult =
  | { response: NextResponse }
  | { session: Session; scope: WarehouseDepotScope };

export async function warehouseSessionScope(warehouseKey: string): Promise<WarehouseSessionResult> {
  const gate = await requireWarehousePermission(warehouseKey);
  if ("response" in gate && gate.response) {
    return { response: gate.response };
  }
  const scope = await getWarehouseDepotScope(gate.session.user.id);
  return { session: gate.session, scope };
}
