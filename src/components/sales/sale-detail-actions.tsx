"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileCheck, Send } from "lucide-react";
import { userCanValidateSales } from "@/lib/rbac/can-validate-sale";
import { LoadingButtonContent } from "@/components/ui/loading";
import type { SaleRecordStatus } from "@/generated/prisma/enums";

type Props = {
  saleId: string;
  status: SaleRecordStatus;
  hasExitVoucher: boolean;
  exitVoucherId?: string | null;
  invoiceNumber: string | null;
};

export function SaleDetailActions({
  saleId,
  status,
  hasExitVoucher,
  exitVoucherId,
  invoiceNumber,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleCode = session?.user?.roleCode ?? session?.user?.role;
  const isCommercial = (roleCode ?? "").toUpperCase() === "COMMERCIAL";
  const canValidate = userCanValidateSales(session?.user?.permissions, roleCode);

  async function validateSale() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/sales/${saleId}/validate`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Échec de la validation");
      return;
    }
    router.refresh();
  }

  if (status === "PENDING_VALIDATION" && canValidate) {
    return (
      <section className="rounded-xl border border-amber-400/40 bg-amber-50/80 p-5 shadow-sm">
        <h3 className="font-semibold text-amber-950">Demande de validation</h3>
        <p className="mt-1 text-sm text-amber-900/80">
          Un commercial a demandé la validation de cette vente. Validez pour générer la facture et le bon de
          sortie, et notifier le commercial.
        </p>
        {error && <p className="mt-2 text-sm text-morocco-600">{error}</p>}
        <button
          type="button"
          disabled={loading}
          onClick={() => void validateSale()}
          className="mt-3 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 disabled:opacity-50"
        >
          <LoadingButtonContent loading={loading} loadingLabel="Validation…">
            Valider la vente
          </LoadingButtonContent>
        </button>
      </section>
    );
  }

  if (status === "PENDING_VALIDATION" && !canValidate) {
    return (
      <section className="rounded-xl border border-amber-400/40 bg-amber-50/80 p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold text-amber-950">
          <Send className="h-4 w-4" />
          En attente de validation
        </p>
        <p className="mt-2 text-amber-900/90">
          Votre demande a été envoyée aux gérants et administrateurs. Vous recevrez une notification dès
          validation pour accéder à la facture et au bon de sortie.
        </p>
      </section>
    );
  }

  if (status === "DRAFT" && canValidate) {
    return (
      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <p className="text-sm text-navy-600">Brouillon — validez depuis le formulaire ou ici.</p>
        {error && <p className="mt-2 text-sm text-morocco-600">{error}</p>}
        <button
          type="button"
          disabled={loading}
          onClick={() => void validateSale()}
          className="mt-2 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
        >
          Valider la vente
        </button>
      </section>
    );
  }

  if (status === "VALIDATED") {
    return (
      <section className="rounded-xl border border-emerald-600/25 bg-emerald-50/50 p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold text-emerald-900">
          <FileCheck className="h-4 w-4" />
          Vente validée — documents disponibles
        </p>
        <p className="mt-1 text-navy-600">
          {invoiceNumber ? `Facture ${invoiceNumber}` : "Facture générée"}
          {hasExitVoucher ? " · Bon de sortie disponible" : " · Bon de sortie en cours"}
        </p>
        {isCommercial && (
          <p className="mt-1 text-xs text-navy-500">
            Vous avez été notifié de la validation. Utilisez les liens ci-dessous pour prévisualiser ou
            télécharger les documents.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/documents/preview/sales-invoice/${saleId}`}
            className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
          >
            Facture — prévisualiser / PDF
          </Link>
          {exitVoucherId && (
            <>
              <Link
                href={`/dashboard/documents/preview/exit-voucher/${exitVoucherId}`}
                className="rounded-lg border border-navy-950/15 px-4 py-2 text-sm font-medium"
              >
                Bon de sortie — prévisualiser
              </Link>
              <a
                href={`/api/exit-vouchers/${exitVoucherId}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-navy-950/15 px-4 py-2 text-sm font-medium"
              >
                Bon de sortie — PDF
              </a>
            </>
          )}
        </div>
      </section>
    );
  }

  return null;
}
