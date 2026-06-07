import type { PermissionKey } from "@/lib/rbac/definitions";

/** Permissions métier magasin → clés RBAC existantes (module magasin). */
export const WAREHOUSE_PERMISSION_MAP: Record<string, PermissionKey> = {
  "warehouse.dashboard.view": "magasin.view",
  "warehouse.pending_deliveries.view": "magasin.view",
  "warehouse.vehicles.view": "magasin.view",
  "warehouse.delivery_history.view": "magasin.view",
  "warehouse.delivery_note.generate": "magasin.validate",
  "warehouse.delivery_note.download": "magasin.view",
  "warehouse.delivery_note.confirm": "magasin.validate",
  "warehouse.delivery_note.upload_signed": "magasin.validate",
  "warehouse.qr.scan": "magasin.view",
};

export function resolveWarehousePermission(key: string): PermissionKey {
  return WAREHOUSE_PERMISSION_MAP[key] ?? (key as PermissionKey);
}
