import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CompanyDocumentBlock, DocumentChecklistItem, DocumentMetaItem } from "@/lib/documents/types";

export function DocumentLayout({
  children,
  className,
  scale = 1,
}: {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}) {
  return (
    <div
      className={cn("mx-auto origin-top transition-transform duration-200", className)}
      style={{ transform: `scale(${scale})` }}
    >
      <article className="document-sheet mx-auto flex w-[210mm] min-h-[297mm] flex-col bg-white text-navy-950 shadow-xl print:shadow-none">
        {children}
      </article>
    </div>
  );
}

export function DocumentHeader({
  company,
  title,
  subtitle,
  statusLabel,
  qrUrl,
}: {
  company: CompanyDocumentBlock;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  qrUrl?: string;
}) {
  const displayName = company.tradeName || company.legalName || "SOFISMART";
  return (
    <header className="border-b border-navy-950/10 px-8 pt-8 pb-5">
      <div className="flex items-start justify-between gap-6">
        <div className="flex gap-4">
          {company.logoUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-navy-950/10">
              <Image src={company.logoUrl} alt="" fill className="object-contain p-1" unoptimized />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-navy-950 text-xs font-bold text-gold-300">
              SOFI
            </div>
          )}
          <div className="text-xs leading-relaxed text-navy-600">
            <p className="font-display text-lg font-semibold text-navy-950">{displayName}</p>
            {company.legalForm && <p>{company.legalForm}</p>}
            <p>
              {[company.ice && `ICE ${company.ice}`, company.rc && `RC ${company.rc}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p>{[company.address, company.city, company.country].filter(Boolean).join(", ")}</p>
            <p>{[company.phone && `Tél. ${company.phone}`, company.email].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="text-right">
          <DocumentStatusBadge label={statusLabel} />
          <h1 className="mt-2 font-display text-xl font-semibold tracking-tight text-navy-950">{title}</h1>
          {subtitle && <p className="mt-1 font-mono text-sm text-gold-700">{subtitle}</p>}
          {qrUrl && (
            <div className="mt-3 flex flex-col items-end">
              <DocumentQRCode url={qrUrl} size={88} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
    </header>
  );
}

export function DocumentFooter({ company, pageNote }: { company: CompanyDocumentBlock; pageNote?: string }) {
  const lines = [
    company.bankAccount ? `${company.bankName ?? "Banque"} : ${company.bankAccount}` : null,
    company.documentNotes,
    pageNote ?? "Document généré par SOFISMART — usage professionnel.",
  ].filter(Boolean) as string[];

  return (
    <footer className="mt-auto border-t border-navy-950/10 px-8 py-4 text-[10px] leading-relaxed text-navy-500">
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </footer>
  );
}

export function DocumentSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-8 py-3", className)}>
      <h2 className="mb-2 border-l-4 border-gold-500 pl-2 text-[11px] font-bold uppercase tracking-wider text-navy-800">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DocumentInfoGrid({ items }: { items: DocumentMetaItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-8 py-3 text-xs">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-[10px] uppercase tracking-wide text-navy-500">{item.label}</p>
          <p className="font-semibold text-navy-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function DocumentClientBlock({
  client,
}: {
  client: { name: string; cin: string | null; ice: string | null; phone: string | null; address: string | null };
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      <div className="col-span-2">
        <dt className="text-navy-500">Nom / raison sociale</dt>
        <dd className="font-semibold">{client.name}</dd>
      </div>
      <div>
        <dt className="text-navy-500">CIN / ICE</dt>
        <dd>{client.cin ?? client.ice ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-navy-500">Téléphone</dt>
        <dd>{client.phone ?? "—"}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-navy-500">Adresse</dt>
        <dd>{client.address ?? "—"}</dd>
      </div>
    </dl>
  );
}

export function DocumentVehicleBlock({
  vehicle,
  extra,
}: {
  vehicle: {
    title: string;
    version: string | null;
    year: number;
    color: string | null;
    plate: string | null;
    vin: string | null;
    mileage: number;
    fuel?: string | null;
    transmission?: string | null;
    origin?: string | null;
  };
  extra?: { label: string; value: string }[];
}) {
  const rows = [
    ["Marque / modèle", vehicle.title],
    ["Version", vehicle.version ?? "—"],
    ["Année", String(vehicle.year)],
    ["Couleur", vehicle.color ?? "—"],
    ["Immatriculation", vehicle.plate ?? "—"],
    ["N° châssis", vehicle.vin ?? "—"],
    ["Kilométrage", `${vehicle.mileage.toLocaleString("fr-FR")} km`],
    vehicle.fuel ? ["Carburant", vehicle.fuel] : null,
    vehicle.transmission ? ["Boîte", vehicle.transmission] : null,
    vehicle.origin ? ["Origine", vehicle.origin] : null,
    ...(extra ?? []).map((e) => [e.label, e.value] as [string, string]),
  ].filter(Boolean) as [string, string][];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-navy-500">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DocumentInstructionBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-8 my-3 rounded-lg border border-gold-400/40 bg-gold-500/5 px-4 py-3 text-xs leading-relaxed text-navy-800">
      {children}
    </div>
  );
}

export function DocumentChecklist({ items }: { items: DocumentChecklistItem[] }) {
  return (
    <ul className="space-y-1.5 text-xs">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-navy-950/20 text-[10px]">
            {item.checked === true ? "✓" : ""}
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function DocumentSignatureBox({ labels }: { labels: string[] }) {
  const cols = labels.length >= 3 ? "grid-cols-3" : labels.length === 2 ? "grid-cols-2" : "grid-cols-1";
  return (
    <div className={cn("grid gap-4 px-8 pb-6 pt-4 text-xs", cols)}>
      {labels.map((label) => (
        <div key={label}>
          <p className="text-navy-500">{label}</p>
          <div className="mt-8 border-b border-navy-950/25" />
        </div>
      ))}
    </div>
  );
}

export function DocumentQRCode({ url, size = 96 }: { url: string; size?: number }) {
  const src = `/api/documents/qr?url=${encodeURIComponent(url)}`;
  return (
    <div className="text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="QR Code" width={size} height={size} className="rounded border border-navy-950/10" />
      <p className="mt-1 text-[9px] text-navy-500">Scan sécurisé</p>
    </div>
  );
}

export function DocumentStatusBadge({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <span className="inline-flex rounded-full bg-gold-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700">
      {label}
    </span>
  );
}

export function DocumentTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-navy-950/10 text-xs">
      <table className="w-full">
        <thead className="bg-cream-100 text-left text-[10px] font-bold uppercase tracking-wide text-navy-600">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-950/5">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-navy-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocumentTotals({
  lines,
  highlight,
}: {
  lines: { label: string; value: string; bold?: boolean }[];
  highlight?: string;
}) {
  return (
    <div className="ml-auto w-full max-w-xs space-y-1 px-8 text-xs">
      {lines.map((line) => (
        <div
          key={line.label}
          className={cn(
            "flex justify-between gap-4 border-b border-navy-950/5 py-1",
            line.bold && "border-gold-500/30 font-bold text-navy-950"
          )}
        >
          <span className="text-navy-600">{line.label}</span>
          <span>{line.value}</span>
        </div>
      ))}
      {highlight && <p className="pt-2 font-display text-sm font-semibold text-gold-700">{highlight}</p>}
    </div>
  );
}

