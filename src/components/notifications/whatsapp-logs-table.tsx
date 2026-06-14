"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  ListCard,
  ListCardBody,
  ListCardField,
  ListCardFooter,
  ListCardHeader,
  ListDataShell,
  ListDesktopTable,
  ListMobileCards,
} from "@/components/ui/responsive-list";

type LogRow = {
  id: string;
  recipientPhoneMasked: string;
  recipientName: string | null;
  messageBody: string;
  status: string;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  eventType: string | null;
};

function statusClass(status: string) {
  if (status === "FAILED") return "text-morocco-700";
  if (status === "SENT") return "text-emerald-700";
  return "text-navy-600";
}

export function WhatsAppLogsTable() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/whatsapp/logs?${params}`);
    if (res.ok) setRows(await res.json());
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function retry(id: string) {
    await fetch(`/api/whatsapp/logs/${id}/retry`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-4">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="input-sofi text-sm"
      >
        <option value="">Tous</option>
        <option value="PENDING">En attente</option>
        <option value="SENT">Envoyé</option>
        <option value="FAILED">Échec</option>
        <option value="DELIVERED">Délivré</option>
      </select>
      <ListDataShell empty={rows.length === 0} emptyMessage="Aucun log WhatsApp.">
        <>
          <ListDesktopTable>
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-cream-50 text-xs uppercase text-navy-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Destinataire</th>
                  <th className="px-3 py-2">Événement</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-navy-950/5">
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {new Date(r.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2">
                      <p>{r.recipientName ?? "—"}</p>
                      <p className="text-xs text-navy-500">{r.recipientPhoneMasked}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.eventType ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={statusClass(r.status)}>{r.status}</span>
                      {r.errorMessage && (
                        <p className="mt-0.5 text-xs text-morocco-600">{r.errorMessage}</p>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 text-xs">{r.messageBody}</td>
                    <td className="px-3 py-2">
                      {r.status === "FAILED" && (
                        <button
                          type="button"
                          onClick={() => retry(r.id)}
                          className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
                        >
                          <RefreshCw className="h-3 w-3" /> Réessayer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ListDesktopTable>
          <ListMobileCards>
            {rows.map((r) => (
              <ListCard key={r.id}>
                <ListCardHeader
                  title={r.recipientName ?? r.recipientPhoneMasked}
                  subtitle={new Date(r.createdAt).toLocaleString("fr-FR")}
                  badge={<span className={`text-xs font-semibold ${statusClass(r.status)}`}>{r.status}</span>}
                />
                <ListCardBody>
                  <ListCardField label="Téléphone" value={r.recipientPhoneMasked} />
                  <ListCardField label="Événement" value={r.eventType ?? "—"} />
                  <ListCardField label="Message" value={r.messageBody} fullWidth />
                  {r.errorMessage && (
                    <ListCardField label="Erreur" value={r.errorMessage} fullWidth />
                  )}
                </ListCardBody>
                {r.status === "FAILED" && (
                  <ListCardFooter>
                    <button
                      type="button"
                      onClick={() => retry(r.id)}
                      className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
                    >
                      <RefreshCw className="h-3 w-3" /> Réessayer
                    </button>
                  </ListCardFooter>
                )}
              </ListCard>
            ))}
          </ListMobileCards>
        </>
      </ListDataShell>
    </div>
  );
}
