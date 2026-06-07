"use client";

import { cn } from "@/lib/utils";

const spinnerSizes = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-14 w-14",
} as const;

export type SpinnerSize = keyof typeof spinnerSizes;

/** Indicateur de chargement SofiSmart (anneau navy + arc doré) */
export function SofiSpinner({
  size = "md",
  className,
  label = "Chargement",
}: {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn("sofi-spinner inline-flex shrink-0", spinnerSizes[size], className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sofi-spinner__track" aria-hidden />
      <span className="sofi-spinner__arc" aria-hidden />
      <span className="sofi-spinner__core" aria-hidden />
    </span>
  );
}

/** Zone de liste / tableau en attente */
export function LoadingState({
  label = "Chargement en cours…",
  size = "md",
  className,
  minHeight = "min-h-[12rem]",
}: {
  label?: string;
  size?: SpinnerSize;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-10",
        minHeight,
        className
      )}
    >
      <SofiSpinner size={size} label={label} />
      <p className="sofi-loading-label text-sm font-medium text-navy-600">{label}</p>
    </div>
  );
}

/** Superposition sur formulaire ou panneau pendant une opération */
export function LoadingOverlay({
  label = "Traitement en cours…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-white/85 backdrop-blur-[3px]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <SofiSpinner size="md" label={label} />
      <p className="sofi-loading-label text-sm font-medium text-navy-700">{label}</p>
    </div>
  );
}

/** Contenu de bouton pendant soumission */
export function LoadingButtonContent({
  loading,
  children,
  loadingLabel,
}: {
  loading: boolean;
  children: React.ReactNode;
  loadingLabel?: React.ReactNode;
}) {
  if (!loading) return <>{children}</>;
  return (
    <>
      <SofiSpinner size="xs" className="text-current" />
      <span>{loadingLabel ?? children}</span>
    </>
  );
}
