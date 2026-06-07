"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-cream-50 p-6 font-sans text-navy-950">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl">Erreur application</h1>
          <p className="mt-2 text-sm text-navy-600">
            Un problème inattendu s&apos;est produit. Réessayez ou contactez l&apos;administrateur.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-3 break-all text-xs text-morocco-600">{error.message}</p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
