"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { confirmDeliverySchema, type ConfirmDeliveryInput } from "@/lib/validations/warehouse";
import { LoadingButtonContent } from "@/components/ui/loading";

type Props = {
  deliveryNoteId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ConfirmDeliveryModal({ deliveryNoteId, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedFile, setSignedFile] = useState<File | null>(null);

  const form = useForm<ConfirmDeliveryInput>({
    resolver: zodResolver(confirmDeliverySchema) as never,
    defaultValues: {
      deliveryDate: new Date().toISOString().slice(0, 10),
      deliveryTime: new Date().toTimeString().slice(0, 5),
      checklist: {
        vehicleDelivered: true,
        registrationCard: false,
        keysHanded: true,
        documentsHanded: true,
        accessoriesHanded: false,
        visualInspection: true,
        clientSignature: true,
      },
    },
  });

  if (!open) return null;

  async function onSubmit(data: ConfirmDeliveryInput) {
    setLoading(true);
    setError("");
    try {
      if (signedFile) {
        const fd = new FormData();
        fd.append("file", signedFile);
        const up = await fetch(`/api/warehouse/delivery-notes/${deliveryNoteId}/upload-signed`, {
          method: "POST",
          body: fd,
        });
        if (!up.ok) {
          const j = await up.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? "Échec upload bon signé");
        }
        const doc = await up.json();
        data.signedDocumentUrl = doc.fileUrl;
      }

      const res = await fetch(`/api/warehouse/delivery-notes/${deliveryNoteId}/confirm-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Échec confirmation");
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const checklist = form.watch("checklist");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-lg text-navy-950">Confirmer la livraison</h2>
        {error && <p className="mt-2 text-sm text-morocco-600">{error}</p>}
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-3 text-sm">
          <label className="block">
            <span className="text-navy-700">Date livraison</span>
            <input type="date" {...form.register("deliveryDate")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-navy-700">Heure</span>
            <input type="time" {...form.register("deliveryTime")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-navy-700">Kilométrage</span>
            <input type="number" {...form.register("mileageAtDelivery")} className="input-sofi mt-1 w-full" />
          </label>
          <fieldset className="space-y-2">
            <legend className="font-medium text-navy-800">Checklist</legend>
            {(
              [
                ["vehicleDelivered", "Véhicule remis au client"],
                ["documentsHanded", "Documents remis"],
                ["keysHanded", "Clés remises"],
                ["clientSignature", "Signature client obtenue"],
                ["registrationCard", "Carte grise remise"],
                ["accessoriesHanded", "Accessoires remis"],
                ["visualInspection", "Contrôle visuel effectué"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!checklist?.[key]}
                  onChange={(e) =>
                    form.setValue(`checklist.${key}`, e.target.checked, { shouldValidate: true })
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
          <label className="block">
            <span className="text-navy-700">Observations</span>
            <textarea {...form.register("observations")} className="input-sofi mt-1 w-full" rows={2} />
          </label>
          <label className="block">
            <span className="text-navy-700">Bon signé (PDF / image)</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="mt-1 w-full text-xs"
              onChange={(e) => setSignedFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-sofi-ghost flex-1">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-sofi-primary flex-1">
              <LoadingButtonContent loading={loading} loadingLabel="Confirmation…">
                Confirmer
              </LoadingButtonContent>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
