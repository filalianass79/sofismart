"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import { LoadingOverlay, LoadingButtonContent, LoadingState } from "@/components/ui/loading";
import { CompanyAssetUpload } from "@/components/settings/company-asset-upload";
import { scrollPageToTop } from "@/lib/scroll-to-top";

type Profile = {
  legalName: string;
  tradeName: string | null;
  legalForm: string | null;
  ice: string | null;
  rc: string | null;
  taxId: string | null;
  patent: string | null;
  cnss: string | null;
  capital: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  bankName: string | null;
  bankAccount: string | null;
  logoUrl: string | null;
  headerImageUrl: string | null;
  footerImageUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  documentNotes: string | null;
};

const empty: Profile = {
  legalName: "",
  tradeName: null,
  legalForm: null,
  ice: null,
  rc: null,
  taxId: null,
  patent: null,
  cnss: null,
  capital: null,
  address: null,
  city: null,
  postalCode: null,
  country: "Maroc",
  phone: null,
  fax: null,
  email: null,
  website: null,
  bankName: null,
  bankAccount: null,
  logoUrl: null,
  headerImageUrl: null,
  footerImageUrl: null,
  headerText: null,
  footerText: null,
  documentNotes: null,
};

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-medium text-navy-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function CompanyProfileManager() {
  const [form, setForm] = useState<Profile>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/company-profile");
    if (res.ok) setForm(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/company-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm(await res.json());
      setSaved(true);
      scrollPageToTop();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Erreur lors de l'enregistrement");
    }
  }

  if (loading) return <LoadingState label="Chargement de l'identification…" />;

  return (
    <form onSubmit={onSubmit} className="relative space-y-6">
      {saving && <LoadingOverlay label="Enregistrement…" />}

      <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/15 text-gold-800">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg text-navy-950">Identification de l&apos;entreprise</h3>
            <p className="mt-1 text-sm text-navy-500">
              Ces informations, le logo, l&apos;en-tête et le pied de page sont utilisés sur les documents générés
              (bons de sortie, rapports, factures de vente).
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Informations juridiques</h4>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Raison sociale *" className="sm:col-span-2">
            <input
              required
              value={form.legalName}
              onChange={(e) => set("legalName", e.target.value)}
              className="input-sofi w-full"
            />
          </Field>
          <Field label="Nom commercial">
            <input
              value={form.tradeName ?? ""}
              onChange={(e) => set("tradeName", e.target.value || null)}
              className="input-sofi w-full"
            />
          </Field>
          <Field label="Forme juridique">
            <input
              value={form.legalForm ?? ""}
              onChange={(e) => set("legalForm", e.target.value || null)}
              placeholder="SARL, SA…"
              className="input-sofi w-full"
            />
          </Field>
          <Field label="ICE">
            <input value={form.ice ?? ""} onChange={(e) => set("ice", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="RC">
            <input value={form.rc ?? ""} onChange={(e) => set("rc", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Identifiant fiscal (IF)">
            <input value={form.taxId ?? ""} onChange={(e) => set("taxId", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Patente">
            <input value={form.patent ?? ""} onChange={(e) => set("patent", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="CNSS">
            <input value={form.cnss ?? ""} onChange={(e) => set("cnss", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Capital social">
            <input value={form.capital ?? ""} onChange={(e) => set("capital", e.target.value || null)} className="input-sofi w-full" />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Coordonnées</h4>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Adresse" className="sm:col-span-2">
            <textarea
              rows={2}
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value || null)}
              className="input-sofi w-full"
            />
          </Field>
          <Field label="Ville">
            <input value={form.city ?? ""} onChange={(e) => set("city", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Code postal">
            <input value={form.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Pays">
            <input value={form.country ?? ""} onChange={(e) => set("country", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Téléphone">
            <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Fax">
            <input value={form.fax ?? ""} onChange={(e) => set("fax", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="Site web">
            <input value={form.website ?? ""} onChange={(e) => set("website", e.target.value || null)} className="input-sofi w-full" />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Informations bancaires</h4>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Banque">
            <input value={form.bankName ?? ""} onChange={(e) => set("bankName", e.target.value || null)} className="input-sofi w-full" />
          </Field>
          <Field label="RIB / Compte">
            <input value={form.bankAccount ?? ""} onChange={(e) => set("bankAccount", e.target.value || null)} className="input-sofi w-full" />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-6 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-navy-600">Identité visuelle des documents</h4>
        <p className="mt-1 text-xs text-navy-500">
          Le logo apparaît sur tous les PDF générés. L&apos;en-tête et le pied de page (image ou texte) sont insérés en haut et en bas
          de chaque page (factures, bons, rapports).
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <CompanyAssetUpload
            label="Logo entreprise"
            hint="Format carré recommandé (PNG)"
            type="logo"
            value={form.logoUrl}
            onChange={(p) => set("logoUrl", p)}
            aspect="square"
          />
          <CompanyAssetUpload
            label="En-tête (image)"
            hint="Bandeau pleine largeur — prioritaire sur le texte"
            type="header"
            value={form.headerImageUrl}
            onChange={(p) => set("headerImageUrl", p)}
            aspect="banner"
            className="lg:col-span-2"
          />
          <CompanyAssetUpload
            label="Pied de page (image)"
            hint="Bandeau bas de page — téléchargeable"
            type="footer"
            value={form.footerImageUrl}
            onChange={(p) => set("footerImageUrl", p)}
            aspect="banner"
            className="lg:col-span-3"
          />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Texte d'en-tête (si pas d'image)" className="sm:col-span-2">
            <textarea
              rows={4}
              value={form.headerText ?? ""}
              onChange={(e) => set("headerText", e.target.value || null)}
              placeholder="Lignes affichées sous le logo…"
              className="input-sofi w-full font-mono text-xs"
            />
          </Field>
          <Field label="Texte de pied de page" className="sm:col-span-2">
            <textarea
              rows={3}
              value={form.footerText ?? ""}
              onChange={(e) => set("footerText", e.target.value || null)}
              placeholder="Mentions légales, conditions…"
              className="input-sofi w-full font-mono text-xs"
            />
          </Field>
          <Field label="Notes / mentions légales complémentaires" className="sm:col-span-2">
            <textarea
              rows={2}
              value={form.documentNotes ?? ""}
              onChange={(e) => set("documentNotes", e.target.value || null)}
              className="input-sofi w-full text-xs"
            />
          </Field>
        </div>
      </section>

      {error && <p className="text-sm text-morocco-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Identification enregistrée.</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-sofi-primary inline-flex items-center gap-2">
          <Save className="h-4 w-4" />
          <LoadingButtonContent loading={saving} loadingLabel="Enregistrement…">
            Enregistrer l&apos;identification
          </LoadingButtonContent>
        </button>
      </div>
    </form>
  );
}
