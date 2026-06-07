"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { UserPlus, User, Building2, Phone, Hash, Mail } from "lucide-react";
import { ClientTypeSelector } from "./client-type-selector";
import { LoadingState } from "@/components/ui/loading";
import { ListFilterToolbar, FilterField, countActiveFilters } from "@/components/ui/list-filters";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { clientTypeLabels } from "@/lib/client-labels";
import type { ClientType } from "@/generated/prisma/enums";
import type { SaleWizardValues } from "@/lib/validations/sale";

type ClientHit = {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  cin: string | null;
  ice: string | null;
  city: string | null;
  outstandingAmount: number;
  salesCount: number;
  financialStatus: string;
};

const initialFilters = { type: "", withOutstanding: "" };

export function SaleClientStep({ onClientSelected }: { onClientSelected: () => void }) {
  const { watch, setValue, formState: { errors } } = useFormContext<SaleWizardValues>();
  const clientMode = watch("clientMode");
  const clientId = watch("clientId");
  const newClient = watch("newClient");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [hits, setHits] = useState<ClientHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [clientType, setClientType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");

  useEffect(() => {
    setValue("clientMode", "EXISTING");
  }, [setValue]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ activeOnly: "true" });
    if (search.trim()) params.set("q", search.trim());
    if (filters.type) params.set("type", filters.type);
    if (filters.withOutstanding === "yes") params.set("withOutstanding", "true");
    const res = await fetch(`/api/clients/search?${params}`);
    if (res.ok) setHits(await res.json());
    setLoading(false);
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const activeFilterCount = countActiveFilters(filters);

  function selectExistingClient(id: string) {
    setValue("clientMode", "EXISTING");
    setValue("clientId", id);
    setValue("newClient", undefined);
    setShowNew(false);
    onClientSelected();
  }

  function initNewClient(type: "INDIVIDUAL" | "COMPANY") {
    setClientType(type);
    setValue("clientMode", "NEW");
    setValue("clientId", undefined);
    if (type === "INDIVIDUAL") {
      setValue("newClient", { type: "INDIVIDUAL", firstName: "", lastName: "", phone: "" });
    } else {
      setValue("newClient", { type: "COMPANY", companyName: "", phone: "" });
    }
    setShowNew(true);
  }

  const clientErrors = errors as { clientId?: { message?: string } };

  return (
    <section className="space-y-5 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header>
          <h3 className="font-display text-xl text-navy-950">Client</h3>
          <p className="mt-1 text-sm text-navy-500">
            Cliquez sur une carte pour passer à l&apos;étape véhicule.
          </p>
        </header>
        <button
          type="button"
          onClick={() => initNewClient("INDIVIDUAL")}
          className="inline-flex items-center gap-1 rounded-lg border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-900"
        >
          <UserPlus className="h-4 w-4" /> Nouveau client
        </button>
      </div>

      {!showNew && clientMode !== "NEW" && (
        <>
          <ListFilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Nom, téléphone, CIN, ICE, email…"
            activeFiltersCount={activeFilterCount}
            onResetFilters={() => setFilters(initialFilters)}
          >
            <FilterField label="Type de client">
              <select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                className="input-sofi w-full"
              >
              <option value="">Tous types</option>
              {(Object.keys(clientTypeLabels) as ClientType[]).map((k) => (
                <option key={k} value={k}>
                  {clientTypeLabels[k]}
                </option>
              ))}
              </select>
            </FilterField>
            <FilterField label="Impayés">
              <select
                value={filters.withOutstanding}
                onChange={(e) => setFilters((f) => ({ ...f, withOutstanding: e.target.value }))}
                className="input-sofi w-full"
              >
              <option value="">Tous</option>
              <option value="yes">Avec impayé</option>
              </select>
            </FilterField>
          </ListFilterToolbar>

          {clientErrors.clientId && (
            <p className="text-sm text-morocco-600">{clientErrors.clientId.message}</p>
          )}

          {loading ? (
            <LoadingState label="Recherche clients…" minHeight="min-h-[8rem]" size="sm" />
          ) : (
            <>
              <p className="text-xs text-navy-500">
                {hits.length} client{hits.length !== 1 ? "s" : ""} — cliquez sur une carte pour continuer
              </p>
              <div className="grid max-h-[min(420px,50vh)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                {hits.map((c) => {
                  const active = clientId === c.id;
                  const isCompany = c.type === "COMPANY" || c.type === "RESELLER";
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectExistingClient(c.id)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                        active
                          ? "border-gold-500 bg-gold-500/15 ring-2 ring-gold-400/40"
                          : "border-navy-950/10 bg-white hover:border-gold-400/50 hover:bg-cream-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            active ? "bg-gold-500 text-navy-950" : "bg-navy-950/5 text-navy-600"
                          )}
                        >
                          {isCompany ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-navy-950">{c.name}</p>
                          {c.city && <p className="mt-0.5 text-xs text-navy-500">{c.city}</p>}
                          <div className="mt-2 space-y-0.5 text-xs text-navy-600">
                            {(c.ice || c.cin) && (
                              <p className="flex items-center gap-1">
                                <Hash className="h-3 w-3 shrink-0" />
                                {c.ice ? `ICE ${c.ice}` : `CIN ${c.cin}`}
                              </p>
                            )}
                            {c.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0" />
                                {c.phone}
                              </p>
                            )}
                            {c.email && (
                              <p className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 shrink-0" />
                                {c.email}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-medium">
                            <span className="rounded bg-navy-950/5 px-1.5 py-0.5 text-navy-600">
                              {c.salesCount} vente{c.salesCount !== 1 ? "s" : ""}
                            </span>
                            {c.outstandingAmount > 0 && (
                              <span className="rounded bg-morocco-500/15 px-1.5 py-0.5 text-morocco-700">
                                Impayé {formatMoney(c.outstandingAmount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {hits.length === 0 && (
                <p className="rounded-lg border border-dashed border-navy-950/15 py-8 text-center text-sm text-navy-400">
                  Aucun client ne correspond à votre recherche.
                </p>
              )}
            </>
          )}
        </>
      )}

      {(clientMode === "NEW" || showNew) && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setShowNew(false);
              setValue("clientMode", "EXISTING");
            }}
            className="text-sm text-navy-600 hover:text-navy-950"
          >
            ← Retour à la liste des clients
          </button>
          <p className="text-sm text-navy-600">
            Renseignez le nouveau client puis utilisez « Étape suivante ».
          </p>
          <ClientTypeSelector
            value={clientType}
            onChange={(t) => {
              initNewClient(t);
            }}
          />
          {clientType === "INDIVIDUAL" && newClient?.type === "INDIVIDUAL" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-navy-700">Civilité</span>
                <select
                  className="input-sofi mt-1 w-full"
                  value={newClient.civility ?? ""}
                  onChange={(e) =>
                    setValue("newClient", { ...newClient, civility: e.target.value as "MR" | "MRS" | "MISS" })
                  }
                >
                  <option value="">—</option>
                  <option value="MR">M.</option>
                  <option value="MRS">Mme</option>
                  <option value="MISS">Mlle</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="text-navy-700">Prénom *</span>
                <input
                  className="input-sofi mt-1 w-full"
                  value={newClient.firstName}
                  onChange={(e) => setValue("newClient", { ...newClient, firstName: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <span className="text-navy-700">Nom *</span>
                <input
                  className="input-sofi mt-1 w-full"
                  value={newClient.lastName}
                  onChange={(e) => setValue("newClient", { ...newClient, lastName: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <span className="text-navy-700">CIN</span>
                <input
                  className="input-sofi mt-1 w-full"
                  value={newClient.cin ?? ""}
                  onChange={(e) => setValue("newClient", { ...newClient, cin: e.target.value })}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="text-navy-700">Téléphone *</span>
                <input
                  className="input-sofi mt-1 w-full"
                  value={newClient.phone}
                  onChange={(e) => setValue("newClient", { ...newClient, phone: e.target.value })}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="text-navy-700">Email</span>
                <input
                  type="email"
                  className="input-sofi mt-1 w-full"
                  value={newClient.email ?? ""}
                  onChange={(e) => setValue("newClient", { ...newClient, email: e.target.value })}
                />
              </label>
            </div>
          )}
          {clientType === "COMPANY" && newClient?.type === "COMPANY" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <span className="text-navy-700">Raison sociale *</span>
                <input
                  className="input-sofi mt-1 w-full"
                  value={newClient.companyName}
                  onChange={(e) => setValue("newClient", { ...newClient, companyName: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <span className="text-navy-700">ICE</span>
                <input
                  className="input-sofi mt-1 w-full"
                  value={newClient.ice ?? ""}
                  onChange={(e) => setValue("newClient", { ...newClient, ice: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <span className="text-navy-700">Téléphone *</span>
                <input
                  className="input-sofi mt-1 w-full"
                  value={newClient.phone}
                  onChange={(e) => setValue("newClient", { ...newClient, phone: e.target.value })}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
