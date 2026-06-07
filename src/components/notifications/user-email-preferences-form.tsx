"use client";

import { useCallback, useEffect, useState } from "react";

const SECURITY_EVENTS = ["PASSWORD_RESET", "PASSWORD_CHANGED", "ACCOUNT_BLOCKED", "USER_CREATED"];

export function UserEmailPreferencesForm() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [alternativeEmail, setAlternativeEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/me/email-preferences");
    if (res.ok) {
      const p = await res.json();
      setEmailEnabled(p.emailEnabled ?? true);
      setAlternativeEmail(p.alternativeEmail ?? "");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    await fetch("/api/me/email-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailEnabled,
        alternativeEmail: alternativeEmail || null,
        disabledEventTypes: [],
      }),
    });
    setSaved(true);
  }

  return (
    <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-navy-900">Préférences email</h3>
      <p className="mb-4 text-sm text-navy-600">
        Les emails de sécurité ({SECURITY_EVENTS.join(", ")}) ne peuvent pas être désactivés.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(e) => setEmailEnabled(e.target.checked)}
        />
        Recevoir les notifications par email
      </label>
      <label className="mt-4 block text-sm text-navy-600">Email alternatif (optionnel)</label>
      <input
        className="input-sofi mt-1"
        type="email"
        placeholder="autre@email.ma"
        value={alternativeEmail}
        onChange={(e) => setAlternativeEmail(e.target.value)}
      />
      <button
        type="button"
        onClick={save}
        className="mt-4 rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white"
      >
        Enregistrer
      </button>
      {saved && <p className="mt-2 text-sm text-emerald-700">Préférences enregistrées.</p>}
    </section>
  );
}
