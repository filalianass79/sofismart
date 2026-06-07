import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-4 text-center">
      <p className="font-mono text-sm text-navy-500">404</p>
      <h1 className="mt-2 font-display text-3xl text-navy-950">Page introuvable</h1>
      <p className="mt-2 max-w-md text-sm text-navy-600">
        La ressource demandée n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-5 py-2 text-sm font-semibold text-navy-950"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
