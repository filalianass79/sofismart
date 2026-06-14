"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { depotTypeLabels } from "@/lib/depot-labels";
import { DepotStatusBadge } from "@/components/depots/depot-status-badge";
import { DepotForm } from "@/components/depots/depot-form";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import {
  ListCard,
  ListCardBody,
  ListCardField,
  ListCardFooter,
  ListCardHeader,
  ListDataShell,
  ListDesktopTable,
  ListMobileCards,
} from "@/components/ui/responsive-list";
import type { DepotInput } from "@/lib/validations/depot";
import type { DepotStatus, DepotType } from "@/generated/prisma/enums";
import { scrollPageToTop } from "@/lib/scroll-to-top";

type Manager = { id: string; name: string | null; email: string };

type DepotRow = {
  id: string;
  reference: string;
  name: string;
  city: string | null;
  manager: { name: string | null } | null;
  maxCapacity: number;
  vehiclesCount: number;
  remainingCapacity: number;
  capacityAlert: boolean;
  depotType: DepotType;
  status: DepotStatus;
};

const initialFilters = { city: "", status: "", depotType: "" };

const settingsFormCard =
  "rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm ring-1 ring-gold-500/10";

export function DepotsManager({
  managers,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: {
  managers: Manager[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const [rows, setRows] = useState<DepotRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<Partial<DepotInput> | undefined>();
  const [loadingEdit, setLoadingEdit] = useState(false);

  const activeCount = countActiveFilters(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.city) params.set("city", filters.city);
    if (filters.status) params.set("status", filters.status);
    if (filters.depotType) params.set("depotType", filters.depotType);
    const res = await fetch(`/api/depots?${params}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function closeForm() {
    setFormOpen(false);
    setEditId(null);
    setFormInitial(undefined);
  }

  function openCreate() {
    setEditId(null);
    setFormInitial(undefined);
    setFormOpen(true);
  }

  async function openEdit(id: string) {
    setLoadingEdit(true);
    setFormOpen(true);
    setEditId(id);
    const res = await fetch(`/api/depots/${id}`);
    setLoadingEdit(false);
    if (!res.ok) {
      closeForm();
      return;
    }
    const d = await res.json();
    setFormInitial({
      name: d.name,
      address: d.address ?? undefined,
      city: d.city ?? undefined,
      phone: d.phone ?? undefined,
      managerId: d.managerId,
      maxCapacity: d.maxCapacity,
      depotType: d.depotType,
      status: d.status,
      notes: d.notes ?? undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-navy-950">Dépôts</h3>
        {canCreate && !formOpen && (
          <button type="button" onClick={openCreate} className="btn-sofi-primary">
            <Plus className="h-4 w-4" />
            Nouveau dépôt
          </button>
        )}
      </div>

      {formOpen && ((!editId && canCreate) || (!!editId && canEdit)) && (
        <section className={settingsFormCard}>
          <h4 className="font-display text-lg text-navy-950">
            {editId ? "Modifier le dépôt" : "Nouveau dépôt"}
          </h4>
          {loadingEdit ? (
            <LoadingState label="Préparation du formulaire…" minHeight="min-h-[8rem]" size="sm" />
          ) : (
            <div className="mt-4">
              <DepotForm
                key={editId ?? "new"}
                depotId={editId ?? undefined}
                initial={formInitial}
                managers={managers}
                onSuccess={() => {
                  closeForm();
                  load();
                  scrollPageToTop();
                }}
                onCancel={closeForm}
              />
            </div>
          )}
        </section>
      )}

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : nom, référence, ville…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Ville">
          <input
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            placeholder="Ex. Casablanca"
            className="input-sofi w-full"
          />
        </FilterField>
        <FilterField label="Statut">
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </FilterField>
        <FilterField label="Type de dépôt">
          <select
            value={filters.depotType}
            onChange={(e) => setFilters((f) => ({ ...f, depotType: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            {(Object.keys(depotTypeLabels) as DepotType[]).map((k) => (
              <option key={k} value={k}>
                {depotTypeLabels[k]}
              </option>
            ))}
          </select>
        </FilterField>
      </ListFilterToolbar>

      <ListDataShell loading={loading} loadingLabel="Chargement des dépôts…" empty={rows.length === 0} emptyMessage="Aucun dépôt trouvé.">
        <ListDesktopTable className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3 text-right">Capacité</th>
                <th className="px-4 py-3 text-right">Stockés</th>
                <th className="px-4 py-3 text-right">Reste</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((d) => (
                <tr key={d.id} className={d.capacityAlert ? "bg-morocco-50/40" : ""}>
                  <td className="px-4 py-3 font-mono text-xs">{d.reference}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-navy-900">{d.name}</span>
                    <p className="text-xs text-navy-500">{depotTypeLabels[d.depotType]}</p>
                  </td>
                  <td className="px-4 py-3">{d.city ?? "—"}</td>
                  <td className="px-4 py-3">{d.manager?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{d.maxCapacity}</td>
                  <td className="px-4 py-3 text-right">{d.vehiclesCount}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${d.capacityAlert ? "text-morocco-700" : ""}`}
                  >
                    {d.remainingCapacity}
                    {d.capacityAlert && " ⚠"}
                  </td>
                  <td className="px-4 py-3">
                    <DepotStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={`/dashboard/settings/depots/${d.id}`}
                      onEdit={canEdit ? () => openEdit(d.id) : undefined}
                      archive={
                        canDelete
                          ? {
                              url: `/api/depots/${d.id}`,
                              method: "DELETE",
                              confirmMessage: `Archiver le dépôt « ${d.name} » ?`,
                              disabled: d.status === "ARCHIVED",
                            }
                          : undefined
                      }
                      onComplete={load}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ListDesktopTable>
        <ListMobileCards>
          {rows.map((d) => (
            <ListCard key={d.id} className={d.capacityAlert ? "border-morocco-300/60 bg-morocco-50/20" : undefined}>
              <ListCardHeader title={d.name} subtitle={`${d.reference} • ${depotTypeLabels[d.depotType]}`} badge={<DepotStatusBadge status={d.status} />} />
              <ListCardBody>
                <ListCardField label="Ville" value={d.city ?? "—"} />
                <ListCardField label="Responsable" value={d.manager?.name ?? "—"} />
                <ListCardField label="Capacité" value={d.maxCapacity} />
                <ListCardField label="Stockés" value={d.vehiclesCount} />
                <ListCardField label="Reste" value={`${d.remainingCapacity}${d.capacityAlert ? " ⚠" : ""}`} />
              </ListCardBody>
              <ListCardFooter>
                <TableRowActions
                  detailHref={`/dashboard/settings/depots/${d.id}`}
                  onEdit={canEdit ? () => openEdit(d.id) : undefined}
                  archive={
                    canDelete
                      ? {
                          url: `/api/depots/${d.id}`,
                          method: "DELETE",
                          confirmMessage: `Archiver le dépôt « ${d.name} » ?`,
                          disabled: d.status === "ARCHIVED",
                        }
                      : undefined
                  }
                  onComplete={load}
                />
              </ListCardFooter>
            </ListCard>
          ))}
        </ListMobileCards>
      </ListDataShell>
    </div>
  );
}
