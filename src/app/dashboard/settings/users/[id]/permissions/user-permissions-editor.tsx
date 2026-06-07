"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionMatrix } from "@/components/hr/permission-matrix";
import { LoadingButtonContent } from "@/components/ui/loading";

type Perm = { id: string; module: string; action: string };

export function UserPermissionsEditor({
  userId,
  permissions,
  userPermissions,
  onSaved,
  onCancel,
}: {
  userId: string;
  permissions: Perm[];
  userPermissions: { permissionId: string; allowed: boolean }[];
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const initial = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const up of userPermissions) m[up.permissionId] = up.allowed;
    return m;
  }, [userPermissions]);

  const [map, setMap] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/users/${userId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permissions: Object.entries(map).map(([permissionId, allowed]) => ({ permissionId, allowed })),
      }),
    });
    setSaving(false);
    if (onSaved) onSaved();
    else router.refresh();
  }

  return (
    <section className="space-y-4">
      <PermissionMatrix
        permissions={permissions}
        allowedMap={map}
        onChange={(id, allowed) => setMap((p) => ({ ...p, [id]: allowed }))}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={saving} onClick={save} className="btn-sofi-primary disabled:opacity-60">
          <LoadingButtonContent loading={saving} loadingLabel="Enregistrement…">
            Enregistrer
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
