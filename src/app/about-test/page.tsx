"use client";

import { useState } from "react";
import Link from "next/link";
import { StagingBadge } from "@/components/staging/staging-chrome";

const DEMO_ACCOUNTS = [
  { role: "Administrateur", email: "admin@test.sofismart.ma", password: "Admin123*" },
  { role: "Commercial", email: "commercial@test.sofismart.ma", password: "Test123*" },
  { role: "Magasinier", email: "magasinier@test.sofismart.ma", password: "Test123*" },
  { role: "Comptable", email: "comptable@test.sofismart.ma", password: "Test123*" },
  { role: "Directeur", email: "directeur@test.sofismart.ma", password: "Test123*" },
];

export default function AboutTestPage() {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState("");

  async function generateTestPdfs() {
    setPdfLoading(true);
    setPdfResult("");
    try {
      const res = await fetch("/api/test/generate-pdfs", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Erreur");
      setPdfResult(body.message ?? "PDF générés");
    } catch (e) {
      setPdfResult((e as Error).message);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl text-navy-950">SOFISMART TEST</h1>
          <StagingBadge />
        </div>
        <p className="text-sm text-orange-800">
          Environnement de préproduction — données fictives, non contractuelles.
        </p>
      </header>

      <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
        <h2 className="font-semibold text-orange-950">Environnement</h2>
        <p className="mt-2 text-sm text-orange-900">
          Cette instance est dédiée aux tests utilisateurs, démonstrations clients et validation
          fonctionnelle avant la mise en production. Ne jamais y saisir de données réelles clients.
        </p>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-navy-950">Comptes de démonstration</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-navy-500">
                <th className="py-2 pr-4">Rôle</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2">Mot de passe</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ACCOUNTS.map((a) => (
                <tr key={a.email} className="border-b border-navy-950/5">
                  <td className="py-2 pr-4">{a.role}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{a.email}</td>
                  <td className="py-2 font-mono text-xs">{a.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-navy-500">
          Après <code className="rounded bg-navy-950/5 px-1">npm run seed:staging</code>
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy-950">Fonctionnalités disponibles</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-navy-700">
            <li>Véhicules, achats, ventes, proformas</li>
            <li>Clients, fournisseurs, paiements</li>
            <li>Documents & PDF (bons, factures)</li>
            <li>Magasin, QR codes, dashboard</li>
            <li>Notifications email simulées</li>
            <li>Logs WhatsApp simulés</li>
          </ul>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy-950">Fonctionnalités limitées</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-navy-700">
            <li>WhatsApp réel (simulation uniquement)</li>
            <li>Uploads persistants sur Vercel (éphémère)</li>
            <li>OCR factures (lourd — optionnel)</li>
            <li>Paiements bancaires réels</li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-navy-950">Documents & PDF TEST</h2>
        <p className="mt-2 text-sm text-navy-600">
          Génère des PDF de démonstration (bon de sortie, livraison, facture vente, proforma).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pdfLoading}
            onClick={generateTestPdfs}
            className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pdfLoading ? "Génération…" : "Générer PDF TEST"}
          </button>
          <Link
            href="/demo-documents"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Voir demo-documents
          </Link>
        </div>
        {pdfResult && <p className="mt-3 text-sm text-navy-700">{pdfResult}</p>}
      </section>

      <p className="text-sm text-navy-600">
        <Link href="/health" className="text-gold-800 underline">
          Page santé
        </Link>
        {" · "}
        <Link href="/login" className="text-gold-800 underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
