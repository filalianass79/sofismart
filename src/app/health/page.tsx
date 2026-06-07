import Link from "next/link";
import { getAppEnvironment, getAppVersion, getBuildId, getDeployDate } from "@/lib/app-env";

async function fetchHealth() {
  const base = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/health`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export default async function HealthPage() {
  const health = await fetchHealth();
  const env = getAppEnvironment();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <header>
        <h1 className="font-display text-3xl text-navy-950">Santé application</h1>
        <p className="mt-1 text-sm text-navy-600">SOFISMART — diagnostic environnement {env}</p>
      </header>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-navy-500">Statut</dt>
            <dd className="font-semibold text-navy-950">{health?.status ?? "inconnu"}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Base de données</dt>
            <dd className={health?.database?.connected ? "text-green-700" : "text-morocco-700"}>
              {health?.database?.connected ? "Connectée" : health?.database?.error ?? "Non disponible"}
            </dd>
          </div>
          <div>
            <dt className="text-navy-500">Version</dt>
            <dd>{getAppVersion()}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Build</dt>
            <dd className="font-mono text-xs">{getBuildId()}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Déploiement</dt>
            <dd>{getDeployDate() ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Temps réponse API</dt>
            <dd>{health?.responseMs != null ? `${health.responseMs} ms` : "—"}</dd>
          </div>
        </dl>
      </section>

      {health?.features && (
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-semibold text-navy-950">Variables critiques</h2>
          <ul className="space-y-1 text-sm text-navy-700">
            <li>DATABASE_URL : {health.criticalEnv?.hasDatabaseUrl ? "✓" : "✗"}</li>
            <li>AUTH_SECRET : {health.criticalEnv?.hasAuthSecret ? "✓" : "✗"}</li>
            <li>APP_URL : {health.criticalEnv?.hasAppUrl ? "✓" : "✗"}</li>
            <li>Email test : {health.features.emailTestMode ? "oui" : "non"}</li>
            <li>WhatsApp simulé : {!health.features.whatsappEnabled ? "oui" : "non"}</li>
          </ul>
        </section>
      )}

      <p className="text-sm">
        <Link href="/about-test" className="text-gold-800 underline">
          Informations environnement TEST
        </Link>
        {" · "}
        <Link href="/login" className="text-gold-800 underline">
          Connexion
        </Link>
      </p>
    </div>
  );
}
