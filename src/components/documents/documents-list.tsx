"use client";

import { useMemo, useState } from "react";
import { FilterField, ListFilterToolbar, countActiveFilters, matchQuickSearch } from "@/components/ui/list-filters";

export type DocumentRow = {
  id: string;
  createdAt: string;
  category: string;
  originalName: string;
  path: string;
};

const initialFilters = { category: "" };

export function DocumentsList({ initialRows }: { initialRows: DocumentRow[] }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const categories = useMemo(
    () => [...new Set(initialRows.map((d) => d.category).filter(Boolean))].sort(),
    [initialRows]
  );

  const activeCount = countActiveFilters(filters);

  const rows = useMemo(() => {
    return initialRows.filter((d) => {
      if (filters.category && d.category !== filters.category) return false;
      return matchQuickSearch(search, [d.originalName, d.category, d.path]);
    });
  }, [initialRows, search, filters]);

  return (
    <div className="space-y-4">
      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : nom de fichier, catégorie…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Catégorie">
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FilterField>
      </ListFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Fichier</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-950/5">
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3">{new Date(d.createdAt).toLocaleString("fr-FR")}</td>
                <td className="px-4 py-3">{d.category}</td>
                <td className="px-4 py-3">{d.originalName}</td>
                <td className="px-4 py-3 text-right">
                  <a href={d.path} className="text-gold-700 hover:underline" target="_blank" rel="noreferrer">
                    Ouvrir
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-navy-500">Aucun document ne correspond aux critères.</p>
        )}
      </div>
    </div>
  );
}
