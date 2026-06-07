"use client";

import { Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepItem = {
  id: string;
  label: string;
  /** Texte affiché pour les étapes à venir ou sans résumé */
  hint?: string;
  /** @deprecated Utiliser hint */
  description?: string;
};

/** Limite l’affichage dans les cellules du stepper (le texte complet reste en infobulle) */
export function truncateStepperText(text: string, maxLen = 32): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

function StepSummaryLine({ line, active }: { line: string; active: boolean }) {
  const display = truncateStepperText(line, 36);
  return (
    <p
      className={cn(
        "truncate text-[11px] leading-snug sm:text-xs",
        active ? "text-white/90" : "text-white/75"
      )}
      title={line !== display ? line : undefined}
    >
      {display}
    </p>
  );
}

export function Stepper({
  steps,
  current,
  summaries = [],
  onStepClick,
  className,
}: {
  steps: StepItem[];
  current: number;
  /** Lignes de résumé par étape (étapes complétées ou étape active) */
  summaries?: (string[] | null | undefined)[];
  /** Clic sur « Modifier » ou sur une étape terminée */
  onStepClick?: (index: number) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Progression"
      className={cn(
        "overflow-hidden rounded-lg bg-[#1a2b3d] shadow-md ring-1 ring-white/5",
        className
      )}
    >
      <ol className="flex divide-x divide-white/10 overflow-x-auto overscroll-x-contain scrollbar-thin">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const hint = step.hint ?? step.description;
          const lines = (summaries[i] ?? []).filter((l) => l && l.trim());
          const showSummary = (done || active) && lines.length > 0;
          const canEdit = done && onStepClick;
          const hintText = hint ? truncateStepperText(hint, 40) : undefined;

          return (
            <li
              key={step.id}
              className={cn(
                "relative flex w-[8.25rem] shrink-0 flex-col sm:w-[9.25rem] md:min-w-0 md:flex-1 md:shrink",
                active && "bg-[#223548]"
              )}
            >
              {active && (
                <span
                  className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold-400 to-gold-600 shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                  aria-hidden
                />
              )}

              <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-3.5 sm:py-3.5 pl-4">
                <div className="flex min-w-0 items-start gap-2">
                  <StepIcon index={i} done={done} active={active} />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 items-start justify-between gap-1">
                      <p
                        className={cn(
                          "min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-wide sm:text-[11px]",
                          active || done ? "text-white" : "text-white/55"
                        )}
                        title={step.label}
                      >
                        {step.label}
                      </p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onStepClick(i)}
                          className="shrink-0 rounded p-0.5 text-gold-400 transition-colors hover:bg-white/10 hover:text-gold-300"
                          aria-label={`Modifier l'étape ${step.label}`}
                          title="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
                        </button>
                      )}
                    </div>

                    <div className="mt-1.5 min-h-[2rem] max-h-[2.5rem] space-y-0.5 overflow-hidden">
                      {showSummary ? (
                        lines.slice(0, 2).map((line, li) => (
                          <StepSummaryLine key={li} line={line} active={active} />
                        ))
                      ) : active ? (
                        <p
                          className="truncate text-[11px] italic text-white/50 sm:text-xs"
                          title={hint}
                        >
                          {hintText ?? "À compléter"}
                        </p>
                      ) : (
                        <p
                          className="truncate text-[11px] leading-snug text-white/40 sm:text-xs"
                          title={hint}
                        >
                          {hintText ?? "—"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepIcon({
  index,
  done,
  active,
}: {
  index: number;
  done: boolean;
  active: boolean;
}) {
  if (done) {
    return (
      <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500 text-navy-950 shadow-sm">
        <Check className="h-4 w-4 stroke-[2.5]" aria-hidden />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
        active
          ? "border-white bg-white/10 text-white"
          : "border-white/35 bg-transparent text-white/45"
      )}
    >
      {index + 1}
    </span>
  );
}
