"use client";

import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingButtonContent } from "@/components/ui/loading";

export function WizardActions({
  step,
  totalSteps,
  onPrev,
  onNext,
  onDraft,
  onCancel,
  onValidate,
  loading = false,
  isLastStep = false,
  submitLabel = "Valider",
  draftLabel = "Enregistrer brouillon",
  showDraft = true,
  showNext = true,
  nextDisabled = false,
  className,
}: {
  step: number;
  totalSteps: number;
  onPrev?: () => void;
  onNext?: () => void | Promise<void>;
  onDraft?: () => void;
  onCancel?: () => void;
  /** Dernière étape sans soumission de formulaire (ex. achat) */
  onValidate?: () => void;
  loading?: boolean;
  isLastStep?: boolean;
  submitLabel?: string;
  draftLabel?: string;
  showDraft?: boolean;
  showNext?: boolean;
  nextDisabled?: boolean;
  className?: string;
}) {
  const isFirst = step === 0;
  const isLast = isLastStep || step >= totalSteps - 1;
  const canNext = showNext && !isLast && onNext;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-950/10 bg-cream-50/80 px-4 py-3",
        className
      )}
    >
      <div className="flex flex-wrap gap-2">
        {!isFirst && onPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-950/15 bg-white px-4 py-2 text-sm font-medium text-navy-800 hover:bg-cream-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Étape précédente
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-navy-500 hover:text-navy-800"
          >
            Annuler
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {showDraft && onDraft && !isLast && (
          <button
            type="button"
            onClick={onDraft}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-950/15 bg-white px-4 py-2 text-sm font-medium text-navy-800 hover:bg-cream-100 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {draftLabel}
          </button>
        )}
        {canNext && (
          <button
            type="button"
            onClick={() => void onNext()}
            disabled={nextDisabled || loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-5 py-2 text-sm font-semibold text-navy-950 shadow-sm hover:from-gold-500 hover:to-gold-400 disabled:opacity-50"
          >
            <LoadingButtonContent loading={loading} loadingLabel="Patientez…">
              <>
                Étape suivante
                <ChevronRight className="h-4 w-4" />
              </>
            </LoadingButtonContent>
          </button>
        )}
        {isLast && onValidate && (
          <button
            type="button"
            onClick={onValidate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-5 py-2 text-sm font-semibold text-navy-950 shadow-sm disabled:opacity-50"
          >
            <LoadingButtonContent loading={loading} loadingLabel="Traitement…">
              {submitLabel}
            </LoadingButtonContent>
          </button>
        )}
        {isLast && !onValidate && (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-5 py-2 text-sm font-semibold text-navy-950 shadow-sm disabled:opacity-50"
          >
            <LoadingButtonContent loading={loading} loadingLabel="Traitement…">
              {submitLabel}
            </LoadingButtonContent>
          </button>
        )}
      </div>
    </div>
  );
}
