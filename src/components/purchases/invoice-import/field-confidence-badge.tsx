import { cn } from "@/lib/utils";

export function FieldConfidenceBadge({ confidence }: { confidence: number }) {
  const level =
    confidence >= 0.85 ? "high" : confidence >= 0.6 ? "medium" : confidence > 0 ? "low" : "none";
  const labels = {
    high: "Confiance élevée",
    medium: "À vérifier",
    low: "Faible confiance",
    none: "Non détecté",
  };
  const styles = {
    high: "bg-emerald-500/15 text-emerald-800 border-emerald-400/30",
    medium: "bg-amber-500/15 text-amber-900 border-amber-400/35",
    low: "bg-morocco-500/10 text-morocco-700 border-morocco-400/30",
    none: "bg-navy-950/5 text-navy-500 border-navy-950/10",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[level],
      )}
      title={`${Math.round(confidence * 100)} %`}
    >
      {labels[level]}
    </span>
  );
}
