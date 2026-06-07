import { AlertTriangle } from "lucide-react";

export function DatabaseUnavailable({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-morocco-500/30 bg-morocco-500/5 p-6 text-navy-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 shrink-0 text-morocco-600" />
        <div className="space-y-2 text-sm">
          <p className="text-base font-semibold">Base de données indisponible</p>
          <p className="text-navy-700">
            {message ??
              "Impossible de se connecter à PostgreSQL. Démarrez Docker Desktop puis lancez la base avec npm run db:up."}
          </p>
          <ol className="list-decimal list-inside space-y-1 text-navy-600">
            <li>Ouvrir Docker Desktop et attendre qu’il soit prêt</li>
            <li>
              <code className="rounded bg-navy-950/5 px-1">npm run db:up</code>
            </li>
            <li>
              Vérifier <code className="rounded bg-navy-950/5 px-1">DATABASE_URL</code> dans{" "}
              <code className="rounded bg-navy-950/5 px-1">.env</code> (port <strong>5433</strong>)
            </li>
            <li>
              Relancer <code className="rounded bg-navy-950/5 px-1">npm run dev</code>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
