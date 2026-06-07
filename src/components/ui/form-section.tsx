import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-navy-950/10 bg-cream-50/40 p-4 sm:p-5",
        className
      )}
    >
      <header className="mb-4 border-b border-gold-500/25 pb-3">
        <h4 className="font-display text-base font-semibold text-navy-950">{title}</h4>
        {description && <p className="mt-0.5 text-xs text-navy-500">{description}</p>}
      </header>
      {children}
    </section>
  );
}
