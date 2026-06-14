"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, RefreshCw } from "lucide-react";
import { scrollPageToTop } from "@/lib/scroll-to-top";

type ProviderStatus = {
  enabled: boolean;
  testMode: boolean;
  provider: string;
  configured: boolean;
  connection?: { ok: boolean; error?: string };
};

type WaSetting = {
  id: string;
  eventType: string;
  whatsappEnabled: boolean;
  recipientRoles: string[];
  sendToCommercial: boolean;
  sendToWarehouse: boolean;
  sendToManager: boolean;
};

export function WhatsAppSettingsPanel() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [settings, setSettings] = useState<WaSetting[]>([]);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Test SOFISMART — notification WhatsApp production");
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [sRes, setRes] = await Promise.all([
      fetch("/api/whatsapp/status"),
      fetch("/api/whatsapp/settings"),
    ]);
    if (sRes.ok) setStatus(await sRes.json());
    if (setRes.ok) setSettings(await setRes.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSetting(s: WaSetting) {
    await fetch(`/api/whatsapp/settings/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsappEnabled: s.whatsappEnabled,
        recipientRoles: s.recipientRoles,
        sendToCommercial: s.sendToCommercial,
        sendToWarehouse: s.sendToWarehouse,
        sendToManager: s.sendToManager,
      }),
    });
    load();
    scrollPageToTop();
  }

  async function sendTest() {
    setTestResult(null);
    const res = await fetch("/api/whatsapp/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone, message: testMsg }),
    });
    const j = await res.json();
    setTestResult(res.ok ? `Envoi OK (id: ${j.id})` : j.error ?? "Échec");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-emerald-600" />
          <div>
            <h3 className="font-display text-xl text-navy-950">WhatsApp Production</h3>
            <p className="text-sm text-navy-600">Meta WhatsApp Cloud API — notifications salariés</p>
          </div>
        </div>
        {status && (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-navy-500">Statut</dt>
              <dd>{status.enabled ? "Activé" : "Désactivé"} {status.testMode ? "(mode test)" : ""}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Provider</dt>
              <dd className="uppercase">{status.provider}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Configuration</dt>
              <dd>{status.configured ? "OK" : "Incomplète"}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Connexion API</dt>
              <dd>{status.connection?.ok ? "Connecté" : status.connection?.error ?? "—"}</dd>
            </div>
          </dl>
        )}
        <Link href="/dashboard/notifications/whatsapp-logs" className="mt-4 inline-block text-sm text-gold-800 underline">
          Voir les logs WhatsApp →
        </Link>
      </section>

      <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm space-y-3">
        <h4 className="font-semibold text-navy-900">Test d&apos;envoi</h4>
        <input
          value={testPhone}
          onChange={(e) => setTestPhone(e.target.value)}
          placeholder="2126XXXXXXXX"
          className="input-sofi w-full max-w-xs"
        />
        <textarea value={testMsg} onChange={(e) => setTestMsg(e.target.value)} className="input-sofi w-full" rows={3} />
        <button type="button" onClick={sendTest} className="btn-sofi-primary">
          Envoyer test WhatsApp
        </button>
        {testResult && <p className="text-sm text-navy-700">{testResult}</p>}
      </section>

      <section className="space-y-4">
        <h4 className="font-semibold text-navy-900">Événements WhatsApp</h4>
        {settings.map((s) => (
          <div key={s.id} className="rounded-lg border border-navy-950/10 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm">{s.eventType}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={s.whatsappEnabled}
                  onChange={(e) =>
                    setSettings((rows) =>
                      rows.map((r) => (r.id === s.id ? { ...r, whatsappEnabled: e.target.checked } : r)),
                    )
                  }
                />
                WhatsApp activé
              </label>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={s.sendToCommercial}
                  onChange={(e) =>
                    setSettings((rows) =>
                      rows.map((r) => (r.id === s.id ? { ...r, sendToCommercial: e.target.checked } : r)),
                    )
                  }
                />
                Commercial
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={s.sendToWarehouse}
                  onChange={(e) =>
                    setSettings((rows) =>
                      rows.map((r) => (r.id === s.id ? { ...r, sendToWarehouse: e.target.checked } : r)),
                    )
                  }
                />
                Magasinier
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={s.sendToManager}
                  onChange={(e) =>
                    setSettings((rows) =>
                      rows.map((r) => (r.id === s.id ? { ...r, sendToManager: e.target.checked } : r)),
                    )
                  }
                />
                Gérant / Admin
              </label>
            </div>
            <button type="button" onClick={() => saveSetting(settings.find((x) => x.id === s.id)!)} className="btn-sofi-ghost text-sm">
              <RefreshCw className="inline h-3 w-3 mr-1" /> Enregistrer
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
