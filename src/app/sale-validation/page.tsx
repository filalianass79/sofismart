import Link from "next/link";
import { CheckCircle2, AlertCircle, Clock, ShieldAlert } from "lucide-react";

type Outcome = "success" | "already" | "expired" | "unauthorized" | "error" | "invalid";

export default async function SaleValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ outcome?: string; ref?: string; message?: string }>;
}) {
  const sp = await searchParams;
  const outcome = (sp.outcome ?? "invalid") as Outcome;
  const ref = sp.ref ? decodeURIComponent(sp.ref) : undefined;
  const message = sp.message ? decodeURIComponent(sp.message) : undefined;

  const config: Record<
    Outcome,
    { icon: typeof CheckCircle2; title: string; body: string; tone: "ok" | "warn" | "err" }
  > = {
    success: {
      icon: CheckCircle2,
      title: "Vente validée",
      body: ref
        ? `La vente ${ref} a été validée avec succès. La facture et le bon de sortie seront disponibles dans SOFISMART.`
        : "La vente a été validée avec succès.",
      tone: "ok",
    },
    already: {
      icon: CheckCircle2,
      title: "Vente déjà validée",
      body: ref
        ? `La vente ${ref} était déjà validée. Aucune action supplémentaire n'est nécessaire.`
        : "Cette vente était déjà validée.",
      tone: "ok",
    },
    expired: {
      icon: Clock,
      title: "Lien expiré",
      body: "Ce lien de validation n'est plus valide (7 jours). Connectez-vous à SOFISMART pour valider la vente manuellement.",
      tone: "warn",
    },
    unauthorized: {
      icon: ShieldAlert,
      title: "Action non autorisée",
      body: "Votre compte n'est pas autorisé à valider cette vente, ou il n'est plus actif.",
      tone: "err",
    },
    error: {
      icon: AlertCircle,
      title: "Validation impossible",
      body: message ?? "Une erreur est survenue lors de la validation.",
      tone: "err",
    },
    invalid: {
      icon: AlertCircle,
      title: "Lien invalide",
      body: "Le lien de validation est incorrect ou incomplet.",
      tone: "err",
    },
  };

  const { icon: Icon, title, body, tone } = config[outcome] ?? config.invalid;
  const iconClass =
    tone === "ok"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : "text-morocco-600";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(197,160,40,0.35), transparent)",
        }}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex flex-col items-center text-center">
          <Icon className={`mb-4 h-14 w-14 ${iconClass}`} strokeWidth={1.5} />
          <h1 className="font-display text-2xl text-navy-950">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-navy-600">{body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-navy-800"
          >
            Se connecter à SOFISMART
          </Link>
          {outcome === "success" || outcome === "already" ? (
            <p className="text-center text-xs text-navy-500 sm:self-center">
              Vous pouvez fermer cette page.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
