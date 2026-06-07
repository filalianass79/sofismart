"use client";

import { getPublicAppEnvironment, getAppDisplayName } from "@/lib/app-env";

export function StagingBanner() {
  const env = getPublicAppEnvironment();
  if (env !== "staging") return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 border-b border-orange-300 bg-orange-100 px-4 py-2 text-center text-sm font-semibold text-orange-950"
    >
      ENVIRONNEMENT TEST — DONNÉES NON CONTRACTUELLES
    </div>
  );
}

export function StagingBadge() {
  const env = getPublicAppEnvironment();
  if (env !== "staging") return null;

  return (
    <span className="rounded bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      STAGING
    </span>
  );
}

export function StagingAppTitle() {
  const env = getPublicAppEnvironment();
  const name = getAppDisplayName();
  if (env === "staging") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">{name}</p>
        <StagingBadge />
      </div>
    );
  }
  return <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">SOFISMART</p>;
}

export function StagingFooterNote() {
  const env = getPublicAppEnvironment();
  if (env !== "staging") return null;
  return (
    <p className="border-t border-navy-950/10 bg-orange-50 px-6 py-2 text-center text-xs text-orange-900">
      Version TEST — {getAppDisplayName()} — données fictives à des fins de démonstration
    </p>
  );
}
