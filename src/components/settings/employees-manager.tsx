"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { jobFunctionLabels } from "@/lib/employee-labels";
import { EmployeeStatusBadge } from "@/components/hr/employee-status-badge";
import { EmployeeForm, type EmployeeFormData } from "@/components/hr/employee-form";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import type { EmployeeJobFunction, EmployeeStatus } from "@/generated/prisma/enums";
import { scrollPageToTop } from "@/lib/scroll-to-top";

type DepotOption = { id: string; name: string };

type EmployeeRow = {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  jobFunction: EmployeeJobFunction;
  status: EmployeeStatus;
  depot: { id: string; name: string } | null;
  user: { id: string } | null;
};

const initialFilters = { status: "", function: "", depotId: "" };
const settingsFormCard =
  "rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm ring-1 ring-gold-500/10";

function toFormData(employee: Record<string, unknown>): EmployeeFormData {
  const e = employee as {
    firstName: string;
    lastName: string;
    cin: string | null;
    personalEmail: string | null;
    professionalEmail: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    birthDate: string | Date | null;
    hireDate: string | Date | null;
    jobFunction: EmployeeJobFunction;
    department: string | null;
    depotId: string | null;
    contractType: string | null;
    salary: unknown;
    status: string;
    notes: string | null;
  };
  return {
    firstName: e.firstName,
    lastName: e.lastName,
    cin: e.cin ?? undefined,
    personalEmail: e.personalEmail ?? undefined,
    professionalEmail: e.professionalEmail ?? undefined,
    phone: e.phone ?? undefined,
    address: e.address ?? undefined,
    city: e.city ?? undefined,
    birthDate: e.birthDate ? new Date(e.birthDate).toISOString() : undefined,
    hireDate: e.hireDate ? new Date(e.hireDate).toISOString() : undefined,
    jobFunction: e.jobFunction,
    department: e.department ?? undefined,
    depotId: e.depotId ?? undefined,
    contractType: e.contractType ?? undefined,
    salary: e.salary != null ? Number(e.salary) : undefined,
    status: e.status,
    notes: e.notes ?? undefined,
  };
}

export function EmployeesManager({
  depots,
  canCreate,
  canEdit,
}: {
  depots: DepotOption[];
  canCreate: boolean;
  canEdit: boolean;
}) {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<EmployeeFormData | undefined>();
  const [loadingEdit, setLoadingEdit] = useState(false);

  const activeCount = countActiveFilters(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.function) params.set("function", filters.function);
    if (filters.depotId) params.set("depotId", filters.depotId);
    const res = await fetch(`/api/employees?${params}`);
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
    const res = await fetch(`/api/employees/${id}`);
    setLoadingEdit(false);
    if (!res.ok) {
      closeForm();
      return;
    }
    setFormInitial(toFormData(await res.json()));
  }

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-navy-950">Salariés</h3>
        {canCreate && !formOpen && (
          <button type="button" onClick={openCreate} className="btn-sofi-primary">
            <Plus className="h-4 w-4" />
            Ajouter un salarié
          </button>
        )}
      </header>

      {formOpen && (
        <section className={settingsFormCard}>
          <h4 className="font-display text-lg text-navy-950">
            {editId ? "Modifier le salarié" : "Nouveau salarié"}
          </h4>
          {loadingEdit ? (
            <LoadingState label="Préparation du formulaire…" minHeight="min-h-[8rem]" size="sm" />
          ) : (
            <div className="mt-4">
              <EmployeeForm
                key={editId ?? "new"}
                depots={depots}
                employeeId={editId ?? undefined}
                initial={formInitial}
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
        searchPlaceholder="Recherche rapide : nom, réf., CIN, téléphone…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
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
        <FilterField label="Fonction">
          <select
            value={filters.function}
            onChange={(e) => setFilters((f) => ({ ...f, function: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Toutes</option>
            {(Object.keys(jobFunctionLabels) as EmployeeJobFunction[]).map((k) => (
              <option key={k} value={k}>
                {jobFunctionLabels[k]}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Dépôt">
          <select
            value={filters.depotId}
            onChange={(e) => setFilters((f) => ({ ...f, depotId: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FilterField>
      </ListFilterToolbar>

      <section className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des salariés…" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-navy-500">Aucun salarié trouvé.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Fonction</th>
                <th className="px-4 py-3">Dépôt</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Compte</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-mono text-xs">{e.reference}</td>
                  <td className="px-4 py-3 font-medium">
                    {e.firstName} {e.lastName}
                  </td>
                  <td className="px-4 py-3">{jobFunctionLabels[e.jobFunction]}</td>
                  <td className="px-4 py-3 text-navy-600">{e.depot?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <EmployeeStatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3 text-navy-600">{e.user ? "Oui" : "Non"}</td>
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={`/dashboard/settings/employees/${e.id}`}
                      onEdit={canEdit ? () => openEdit(e.id) : undefined}
                      archive={{
                        url: `/api/employees/${e.id}/archive`,
                        method: "PATCH",
                        confirmMessage: `Archiver ${e.firstName} ${e.lastName} ?`,
                        disabled: e.status === "ARCHIVED",
                      }}
                      onComplete={load}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </article>
  );
}
