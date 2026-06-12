"use client";

import { useCallback, useEffect, useState } from "react";
import { scrollPageToTop } from "@/lib/scroll-to-top";
type Setting = {
  id: string;
  eventType: string;
  internalEnabled: boolean;
  whatsappEnabled: boolean;
  recipientRoles: string[];
  sendToClient: boolean;
  isActive: boolean;
};

export function NotificationSettingsPanel() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Test SOFISMART — notification WhatsApp");
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notification-settings");
    if (res.ok) setSettings(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(s: Setting) {
    await fetch(`/api/notification-settings/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: s.eventType,
        internalEnabled: s.internalEnabled,
        whatsappEnabled: s.whatsappEnabled,
        recipientRoles: s.recipientRoles,
        recipientUserIds: [],
        sendToClient: s.sendToClient,
        sendToEmployee: true,
        isActive: s.isActive,
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
    setTestResult(res.ok ? "Message envoyé (voir logs)" : j.error ?? "Échec");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-navy-950/10 bg-white p-4">
        <h3 className="font-semibold text-navy-950">Test WhatsApp</h3>
        <p className="mt-1 text-xs text-navy-500">
          WHATSAPP_ENABLED / WHATSAPP_TEST_MODE via variables d&apos;environnement.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="input-sofi"
            placeholder="+2126..."
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
          <input
            className="input-sofi sm:col-span-2"
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={sendTest}
          className="mt-3 rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Envoyer test
        </button>
        {testResult && <p className="mt-2 text-sm">{testResult}</p>}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-navy-950">Événements</h3>
        {settings.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-navy-950/10 bg-white p-4 text-sm"
          >
            <p className="font-mono text-xs font-semibold text-gold-800">{s.eventType}</p>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.internalEnabled}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, internalEnabled: e.target.checked } : x,
                      ),
                    )
                  }
                />
                Interne
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.whatsappEnabled}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, whatsappEnabled: e.target.checked } : x,
                      ),
                    )
                  }
                />
                WhatsApp
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.sendToClient}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, sendToClient: e.target.checked } : x,
                      ),
                    )
                  }
                />
                Client
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.isActive}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, isActive: e.target.checked } : x,
                      ),
                    )
                  }
                />
                Actif
              </label>
            </div>
            <p className="mt-2 text-xs text-navy-500">
              Rôles : {s.recipientRoles.join(", ") || "—"}
            </p>
            <button
              type="button"
              onClick={() => save(s)}
              className="mt-3 rounded border px-3 py-1.5 text-xs font-medium"
            >
              Enregistrer
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
