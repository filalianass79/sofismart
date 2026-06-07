"use client";

import { useMemo, useState } from "react";
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "@/lib/rbac/definitions";

type PermRow = { id: string; module: string; action: string };

export function PermissionMatrix({
  permissions,
  allowedMap,
  onChange,
  readOnly = false,
}: {
  permissions: PermRow[];
  allowedMap: Record<string, boolean>;
  onChange?: (permissionId: string, allowed: boolean) => void;
  readOnly?: boolean;
}) {
  const [local, setLocal] = useState(allowedMap);

  const byModule = useMemo(() => {
    const m = new Map<string, PermRow[]>();
    for (const p of permissions) {
      const list = m.get(p.module) ?? [];
      list.push(p);
      m.set(p.module, list);
    }
    return m;
  }, [permissions]);

  const toggle = (id: string, v: boolean) => {
    setLocal((prev) => ({ ...prev, [id]: v }));
    onChange?.(id, v);
  };

  const setAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    for (const p of permissions) {
      next[p.id] = v;
      onChange?.(p.id, v);
    }
    setLocal(next);
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="rounded-lg border border-navy-950/15 px-3 py-1 text-xs font-medium"
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="rounded-lg border border-navy-950/15 px-3 py-1 text-xs font-medium"
          >
            Tout désélectionner
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-navy-950/10">
        <table className="min-w-full text-sm">
          <thead className="bg-navy-950/5">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-navy-900">Module</th>
              {PERMISSION_ACTIONS.map((a) => (
                <th key={a} className="px-2 py-2 text-center text-xs font-medium text-navy-600">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((mod) => {
              const rows = byModule.get(mod) ?? [];
              if (!rows.length) return null;
              return (
                <tr key={mod} className="border-t border-navy-950/5">
                  <td className="px-3 py-2 font-medium capitalize text-navy-900">{mod}</td>
                  {PERMISSION_ACTIONS.map((action) => {
                    const perm = rows.find((r) => r.action === action);
                    if (!perm) return <td key={action} className="px-2 py-2" />;
                    const checked = local[perm.id] ?? allowedMap[perm.id] ?? false;
                    return (
                      <td key={action} className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={checked}
                          onChange={(e) => toggle(perm.id, e.target.checked)}
                          className="h-4 w-4 rounded border-navy-300 text-gold-600"
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
