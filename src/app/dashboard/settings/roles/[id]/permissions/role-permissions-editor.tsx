"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionMatrix } from "@/components/hr/permission-matrix";
import { LoadingButtonContent } from "@/components/ui/loading";

type Perm = { id: string; module: string; action: string };

export function RolePermissionsEditor({
  roleId,
  permissions,
  rolePermissions,
  onSaved,
  onCancel,
}: {
  roleId: string;
  permissions: Perm[];
  rolePermissions: { permissionId: string; allowed: boolean }[];
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const initial = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const rp of rolePermissions) m[rp.permissionId] = rp.allowed;
    return m;
  }, [rolePermissions]);

  const [map, setMap] = useState(initial);
  const [saving, setSaving] = useState(false);

  const onChange = (permissionId: string, allowed: boolean) => {
    setMap((prev) => ({ ...prev, [permissionId]: allowed }));
  };

  async function save() {
    setSaving(true);
    const permissionsPayload = Object.entries(map).map(([permissionId, allowed]) => ({
      permissionId,
      allowed,
    }));
    await fetch(`/api/roles/${roleId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: permissionsPayload }),
    });
    setSaving(false);
    if (onSaved) onSaved();
    else router.refresh();
  }

  return (
    <section className="space-y-4">
      <PermissionMatrix permissions={permissions} allowedMap={map} onChange={onChange} />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={saving} onClick={save} className="btn-sofi-primary disabled:opacity-60">
          <LoadingButtonContent loading={saving} loadingLabel="Enregistrement…">
            Enregistrer les permissions
          </LoadingButtonContent>
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-sofi-ghost">
            Annuler
          </button>
        )}
      </div>
    </section>
  );
}
