import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Car,
  HandCoins,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
  ClipboardCheck,
  Package,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AdminDashboardData } from "@/lib/services/admin-dashboard-service";
import { AdminBarChart } from "./bar-chart";
import {
  ListCard,
  ListCardBody,
  ListCardField,
  ListCardFooter,
  ListCardHeader,
  ListDesktopTable,
  ListMobileCards,
} from "@/components/ui/responsive-list";

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  accent = "gold",
  href,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "gold" | "navy" | "emerald" | "sky";
  href?: string;
}) {
  const accents = {
    gold: "from-gold-500/20 to-gold-400/5 border-gold-400/25 text-gold-700",
    navy: "from-navy-950/8 to-navy-950/2 border-navy-950/15 text-navy-800",
    emerald: "from-emerald-500/15 to-emerald-400/5 border-emerald-400/25 text-emerald-800",
    sky: "from-sky-500/15 to-sky-400/5 border-sky-400/25 text-sky-800",
  };
  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-shadow hover:shadow-md ${accents[accent]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">{title}</p>
          <p className="mt-2 font-display text-2xl tracking-tight text-navy-950 sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-navy-600">{hint}</p>}
        </div>
        <div className="rounded-xl bg-white/70 p-2.5 shadow-sm">
          <Icon className="h-6 w-6 shrink-0 opacity-90" />
        </div>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
        {inner}
      </Link>
    );
  }
  return inner;
}

function Panel({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: { href: string; label: string };
}) {
  return (
    <section
      className={`rounded-2xl border border-navy-950/10 bg-white p-5 shadow-sm sm:p-6 ${className ?? ""}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-navy-950">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-navy-500">{subtitle}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-gold-700 hover:text-gold-800"
          >
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function AdminDashboardView({ data }: { data: AdminDashboardData }) {
  const maxCommercial = Math.max(1, ...data.byCommercial.map((c) => c.revenue));
  const maxVehicle = Math.max(1, ...data.vehicleByStatus.map((v) => v.count));

  return (
    <div className="space-y-6">
      {/* Bandeau période */}
      <div className="rounded-2xl border border-navy-950/10 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-300/90">
              Vue direction
            </p>
            <h3 className="mt-1 font-display text-2xl sm:text-3xl">Activité — {data.periodLabel}</h3>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Chiffre d&apos;affaires, marges, performances commerciales, achats et stock véhicules.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-right text-sm">
            <div>
              <p className="text-white/60">CA période</p>
              <p className="font-display text-xl text-gold-300">{formatMoney(data.kpis.revenue)}</p>
            </div>
            <div>
              <p className="text-white/60">Marge période</p>
              <p className="font-display text-xl text-emerald-300">{formatMoney(data.kpis.margin)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Ventes (période)"
          value={String(data.kpis.salesCount)}
          hint={`CA ${formatMoney(data.kpis.revenue)}`}
          icon={HandCoins}
          accent="emerald"
          href="/dashboard/sales"
        />
        <KpiCard
          title="Marge"
          value={formatMoney(data.kpis.margin)}
          hint="Sur la période sélectionnée"
          icon={TrendingUp}
          accent="gold"
        />
        <KpiCard
          title="Achats"
          value={String(data.kpis.purchasesCount)}
          hint={formatMoney(data.kpis.purchasesAmount)}
          icon={ShoppingCart}
          accent="sky"
          href="/dashboard/purchases"
        />
        <KpiCard
          title="Stock véhicules"
          value={String(data.kpis.inStock)}
          hint={`${data.kpis.reserved} réservés · ${data.kpis.sold} vendus`}
          icon={Car}
          accent="navy"
          href="/dashboard/vehicles"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Clients actifs"
          value={String(data.kpis.clientsActive)}
          icon={Users}
          accent="navy"
          href="/dashboard/clients"
        />
        <KpiCard
          title="Validations en attente"
          value={String(data.kpis.pendingValidation)}
          hint="Ventes à valider"
          icon={ClipboardCheck}
          accent={data.kpis.pendingValidation > 0 ? "gold" : "navy"}
          href="/dashboard/sales?status=PENDING_VALIDATION"
        />
        <KpiCard
          title="Dépôts suivis"
          value={String(data.depots.length)}
          hint={data.depotAlerts.length > 0 ? `${data.depotAlerts.length} alerte(s) capacité` : "Capacité OK"}
          icon={Warehouse}
          accent="navy"
          href="/dashboard/settings/depots"
        />
      </div>

      {data.kpis.pendingValidation > 0 && (
        <section className="rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-50 to-amber-100/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-amber-950">
              {data.kpis.pendingValidation} vente(s) en attente de validation
            </h3>
            <Link href="/dashboard/sales?status=PENDING_VALIDATION" className="text-sm font-medium text-gold-800">
              Traiter →
            </Link>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.pendingValidationSales.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/sales/${s.id}`}
                  className="block rounded-lg border border-amber-200/60 bg-white/80 px-3 py-2 text-sm hover:border-gold-400/50"
                >
                  <span className="font-mono font-medium text-navy-900">{s.reference}</span>
                  <span className="text-navy-600">
                    {" "}
                    — {s.commercial ?? "—"} · {s.client ?? "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Graphiques ventes + achats */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Évolution des ventes"
          subtitle={`CA net · ${data.periodLabel}`}
          action={{ href: "/dashboard/sales", label: "Toutes les ventes" }}
        >
          <AdminBarChart buckets={data.salesBuckets} valueKey="revenue" height={220} />
        </Panel>
        <Panel
          title="Achats fournisseurs"
          subtitle={`Montants TTC · ${data.periodLabel}`}
          action={{ href: "/dashboard/purchases", label: "Tous les achats" }}
        >
          <AdminBarChart
            buckets={data.purchaseBuckets}
            valueKey="revenue"
            height={220}
            colorClass="from-sky-600 to-sky-400"
          />
        </Panel>
      </div>

      {/* Commercial + véhicules */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          title="Performance par commercial"
          subtitle={`${data.byCommercial.length} commercial(aux) actifs`}
          className="lg:col-span-3"
          action={{ href: "/dashboard/sales", label: "Détail ventes" }}
        >
          {data.byCommercial.length === 0 ? (
            <p className="text-sm text-navy-500">Aucune vente sur cette période.</p>
          ) : (
            <ul className="space-y-4">
              {data.byCommercial.map((c, i) => (
                <li key={c.id ?? c.name}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 font-medium text-navy-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-950/5 text-xs font-bold text-navy-600">
                        {i + 1}
                      </span>
                      {c.name}
                    </span>
                    <span className="tabular-nums text-navy-700">
                      {c.salesCount} vente{c.salesCount > 1 ? "s" : ""} · {formatMoney(c.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-950/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                      style={{ width: `${Math.round((c.revenue / maxCommercial) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-xs text-emerald-700">
                    Marge {formatMoney(c.margin)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Véhicules par statut" subtitle="Parc actif (non archivé)" className="lg:col-span-2">
          <ul className="space-y-3">
            {data.vehicleByStatus.map((v) => (
              <li key={v.status}>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-800">{v.label}</span>
                  <span className="font-semibold tabular-nums text-navy-950">{v.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-950/8">
                  <div
                    className="h-full rounded-full bg-navy-800"
                    style={{ width: `${Math.round((v.count / maxVehicle) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/vehicles"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold-700"
          >
            Parc véhicules <ArrowRight className="h-4 w-4" />
          </Link>
        </Panel>
      </div>

      {/* Dépôts + ventes récentes */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Capacité dépôts" className="lg:col-span-1">
          <ul className="space-y-3">
            {data.depots.map((d) => (
              <li key={d.id} className="rounded-xl border border-navy-950/8 bg-cream-50/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-navy-900">{d.name}</span>
                  <span className={d.pct >= 85 ? "font-semibold text-morocco-600" : "text-navy-600"}>
                    {d.vehicles}/{d.maxCapacity}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-950/10">
                  <div
                    className={`h-full rounded-full transition-all ${d.pct >= 85 ? "bg-morocco-500" : "bg-gradient-to-r from-gold-600 to-gold-400"}`}
                    style={{ width: `${Math.min(100, d.pct)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Dernières ventes"
          subtitle="Toutes périodes"
          className="lg:col-span-2"
          action={{ href: "/dashboard/sales", label: "Voir tout" }}
        >
          <ListDesktopTable>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy-950/10 text-xs uppercase text-navy-500">
                  <th className="pb-2 pr-3">Réf.</th>
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Client</th>
                  <th className="pb-2 pr-3">Véhicule</th>
                  <th className="pb-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-950/5">
                {data.recentSales.map((s) => (
                  <tr key={s.id} className="hover:bg-cream-50/80">
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/dashboard/sales/${s.id}`}
                        className="font-mono text-xs font-medium text-gold-800 hover:underline"
                      >
                        {s.reference}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-navy-600">
                      {format(new Date(s.saleDate), "dd/MM/yyyy", { locale: fr })}
                    </td>
                    <td className="py-2.5 pr-3 text-navy-800">{s.client ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-navy-600">{s.vehicle}</td>
                    <td className="py-2.5 text-right font-medium tabular-nums text-navy-950">
                      {formatMoney(s.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ListDesktopTable>
          <ListMobileCards>
            {data.recentSales.map((s) => (
              <ListCard key={s.id} href={`/dashboard/sales/${s.id}`}>
                <ListCardHeader
                  title={s.reference}
                  subtitle={format(new Date(s.saleDate), "dd/MM/yyyy", { locale: fr })}
                />
                <ListCardBody>
                  <ListCardField label="Client" value={s.client ?? "—"} fullWidth />
                  <ListCardField label="Véhicule" value={s.vehicle} fullWidth />
                  <ListCardField label="Montant" value={formatMoney(s.revenue)} />
                </ListCardBody>
                <ListCardFooter>
                  <span className="text-xs font-medium text-gold-700">Voir la vente →</span>
                </ListCardFooter>
              </ListCard>
            ))}
          </ListMobileCards>
        </Panel>
      </div>

      {data.depotAlerts.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-morocco-500/30 bg-morocco-500/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-morocco-600" />
          <p className="text-navy-900">
            <span className="font-semibold">Alerte capacité : </span>
            {data.depotAlerts.join(", ")} — occupation ≥ 85 %.
          </p>
        </div>
      )}

      {/* Raccourcis */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/dashboard/sales/new", label: "Nouvelle vente", icon: HandCoins },
          { href: "/dashboard/purchases/new", label: "Nouvel achat", icon: ShoppingCart },
          { href: "/dashboard/vehicles/new", label: "Nouveau véhicule", icon: Car },
          { href: "/dashboard/reports", label: "Rapports & exports", icon: Package },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm transition-all hover:border-gold-400/40 hover:shadow-md"
          >
            <item.icon className="h-5 w-5 text-gold-600" />
            <span className="text-sm font-semibold text-navy-900">{item.label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-navy-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
