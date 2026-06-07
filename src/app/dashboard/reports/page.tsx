export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl text-navy-950">Rapports & exports</h2>
      <p className="text-sm text-navy-600">
        Téléchargements sécurisés (session requise). Les fichiers sont générés côté serveur.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="/api/reports/pdf?type=stock"
          className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm transition hover:border-gold-400/50"
        >
          <p className="font-semibold text-navy-900">PDF — Stock véhicules</p>
          <p className="mt-1 text-sm text-navy-600">Liste détaillée avec dépôt et prix de revient</p>
        </a>
        <a
          href="/api/reports/pdf?type=sales"
          className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm transition hover:border-gold-400/50"
        >
          <p className="font-semibold text-navy-900">PDF — Ventes</p>
          <p className="mt-1 text-sm text-navy-600">Historique des ventes et marges</p>
        </a>
        <a
          href="/api/reports/excel?type=stock"
          className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm transition hover:border-gold-400/50"
        >
          <p className="font-semibold text-navy-900">Excel — Stock</p>
          <p className="mt-1 text-sm text-navy-600">Export .xlsx pour analyse</p>
        </a>
        <a
          href="/api/reports/excel?type=sales"
          className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm transition hover:border-gold-400/50"
        >
          <p className="font-semibold text-navy-900">Excel — Ventes</p>
          <p className="mt-1 text-sm text-navy-600">Tableur compatible LibreOffice / Excel</p>
        </a>
      </div>
    </div>
  );
}
