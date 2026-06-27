"use client";

import { useState } from "react";
import { useFormFeedback } from "@/hooks/use-form-feedback";
import { creditPaymentMethods, debitPaymentMethods } from "@/lib/treasury/cashbox-labels";

type Category = { id: string; name: string; requiresAttachment: boolean };

export function MovementModal({
  mode,
  cashboxId,
  cashboxName,
  open,
  onClose,
  onSuccess,
}: {
  mode: "credit" | "debit";
  cashboxId: string;
  cashboxName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showError, showSuccess } = useFormFeedback();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    amount: "",
    reason: "",
    category: "",
    paymentMethod: "",
    externalReference: "",
    notes: "",
  });

  if (!open) return null;

  if (categories.length === 0 && open) {
    void fetch("/api/treasury/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }

  const methods = mode === "credit" ? creditPaymentMethods : debitPaymentMethods;
  const filteredCats = categories.filter((c) =>
    mode === "credit" ? c.name.toLowerCase().includes("encaissement") || !form.category : true,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      showError("Montant invalide");
      return;
    }
    if (!form.reason.trim()) {
      showError("Motif obligatoire");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/treasury/cashboxes/${cashboxId}/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        reason: form.reason,
        category: form.category || null,
        paymentMethod: form.paymentMethod || null,
        externalReference: form.externalReference || null,
        notes: form.notes || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      showError((j as { error?: string }).error ?? "Erreur");
      return;
    }
    showSuccess(mode === "credit" ? "Crédit enregistré" : "Débit enregistré");
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="font-display text-xl text-navy-950">
          {mode === "credit" ? "Créditer" : "Débiter"} — {cashboxName}
        </h3>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Montant (MAD) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input-sofi mt-1 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Motif *</label>
            <input
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input-sofi mt-1 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-sofi mt-1 w-full"
            >
              <option value="">—</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Mode</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="input-sofi mt-1 w-full"
            >
              <option value="">—</option>
              {methods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Référence externe</label>
            <input
              value={form.externalReference}
              onChange={(e) => setForm({ ...form, externalReference: e.target.value })}
              className="input-sofi mt-1 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-sofi mt-1 w-full"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
            >
              {loading ? "…" : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TransferModal({
  sourceCashboxId,
  sourceName,
  cashboxes,
  open,
  onClose,
  onSuccess,
}: {
  sourceCashboxId: string;
  sourceName: string;
  cashboxes: { id: string; name: string; reference: string }[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showError, showSuccess } = useFormFeedback();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ destinationCashboxId: "", amount: "", reason: "", notes: "" });

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/treasury/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceCashboxId,
        destinationCashboxId: form.destinationCashboxId,
        amount: Number(form.amount),
        reason: form.reason,
        notes: form.notes || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      showError((j as { error?: string }).error ?? "Erreur transfert");
      return;
    }
    showSuccess("Transfert envoyé — en attente de réception");
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <h3 className="font-display text-xl text-navy-950">Transfert depuis {sourceName}</h3>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Caisse destination *</label>
            <select
              required
              value={form.destinationCashboxId}
              onChange={(e) => setForm({ ...form, destinationCashboxId: e.target.value })}
              className="input-sofi mt-1 w-full"
            >
              <option value="">Choisir…</option>
              {cashboxes
                .filter((c) => c.id !== sourceCashboxId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.reference} — {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Montant *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input-sofi mt-1 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Motif *</label>
            <input
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input-sofi mt-1 w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold">
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
