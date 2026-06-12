"use client";

import { useCallback, useEffect, useState } from "react";
import { scrollPageToTop } from "@/lib/scroll-to-top";

type EmailSetting = {
  id: string;
  eventType: string;
  emailEnabled: boolean;
  recipientRoles: string[];
  sendToClient: boolean;
  sendToSupplier: boolean;
  attachDocuments: boolean;
  isActive: boolean;
};

export function EmailSettingsPanel() {
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("Test SOFISMART — notification email");
  const [testMessage, setTestMessage] = useState("Ceci est un email de test depuis SOFISMART.");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [connResult, setConnResult] = useState<string | null>(null);
  const [providerInfo, setProviderInfo] = useState<{
    enabled: boolean;
    testMode: boolean;
    provider: string;
    fromEmail: string;
  } | null>(null);

  const load = useCallback(async () => {
    const [settingsRes, statusRes] = await Promise.all([
      fetch("/api/email-notification-settings"),
      fetch("/api/emails/status"),
    ]);
    if (settingsRes.ok) setSettings(await settingsRes.json());
    if (statusRes.ok) setProviderInfo(await statusRes.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(s: EmailSetting) {
    await fetch(`/api/email-notification-settings/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: s.eventType,
        emailEnabled: s.emailEnabled,
        recipientRoles: s.recipientRoles,
        recipientUserIds: [],
        sendToClient: s.sendToClient,
        sendToSupplier: s.sendToSupplier,
        ccEmails: [],
        bccEmails: [],
        attachDocuments: s.attachDocuments,
        attachmentTypes: [],
        isActive: s.isActive,
      }),
    });
    load();
    scrollPageToTop();
  }

  async function testConnection() {
    setConnResult(null);
    const res = await fetch("/api/emails/provider/test-connection", { method: "POST" });
    const j = await res.json();
    if (res.ok) {
      setConnResult(j.hint ?? "Connexion OK");
    } else {
      setConnResult([j.error, j.hint].filter(Boolean).join(" — ") || "Échec");
    }
  }

  async function sendTest() {
    setTestResult(null);
    const res = await fetch("/api/emails/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testEmail, subject: testSubject, message: testMessage }),
    });
    const j = await res.json();
    if (res.ok && j.ok !== false) {
      setTestResult(
        providerInfo?.testMode
          ? "Email simulé (mode test) — aucun message réel envoyé."
          : "Email envoyé via le provider — vérifiez votre boîte (et les spams).",
      );
    } else {
      setTestResult(j.error ?? "Échec d'envoi — voir /dashboard/emails/logs");
    }
  }

  return (
    <div className="space-y-8">
      {providerInfo && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            !providerInfo.enabled
              ? "border-morocco-300 bg-morocco-50 text-morocco-900"
              : providerInfo.testMode
                ? "border-amber-300 bg-amber-50 text-amber-950"
                : "border-emerald-300 bg-emerald-50 text-emerald-950"
          }`}
        >
          <p className="font-semibold">
            {!providerInfo.enabled
              ? "Emails désactivés (EMAIL_ENABLED≠true)"
              : providerInfo.testMode
                ? "Mode test — aucun envoi réel"
                : `Envoi réel via ${providerInfo.provider}`}
          </p>
          <p className="mt-1 text-xs opacity-90">
            Expéditeur : {providerInfo.fromEmail}
            {providerInfo.provider === "resend" &&
              " — le domaine doit être vérifié sur resend.com"}
          </p>
        </div>
      )}

      <section className="rounded-xl border border-navy-950/10 bg-white p-4">
        <h3 className="font-semibold text-navy-950">Provider email</h3>
        <p className="mt-1 text-xs text-navy-500">
          Variables .env : EMAIL_ENABLED=true, EMAIL_PROVIDER, RESEND_API_KEY ou SMTP_*.
          Redémarrez le serveur après chaque modification du .env.
        </p>
        <button
          type="button"
          onClick={testConnection}
          className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Tester la connexion
        </button>
        {connResult && <p className="mt-2 text-sm">{connResult}</p>}
      </section>

      <section className="rounded-xl border border-navy-950/10 bg-white p-4">
        <h3 className="font-semibold text-navy-950">Envoi test</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="input-sofi"
            placeholder="destinataire@email.ma"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <input
            className="input-sofi"
            value={testSubject}
            onChange={(e) => setTestSubject(e.target.value)}
          />
          <textarea
            className="input-sofi sm:col-span-2"
            rows={3}
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
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
        <h3 className="font-semibold text-navy-950">Événements email</h3>
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
                  checked={s.emailEnabled}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, emailEnabled: e.target.checked } : x,
                      ),
                    )
                  }
                />
                Email activé
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
                  checked={s.sendToSupplier}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, sendToSupplier: e.target.checked } : x,
                      ),
                    )
                  }
                />
                Fournisseur
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.attachDocuments}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, attachDocuments: e.target.checked } : x,
                      ),
                    )
                  }
                />
                Pièces jointes
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
