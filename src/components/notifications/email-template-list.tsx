"use client";

import { useCallback, useEffect, useState } from "react";

type Template = {
  id: string;
  key: string;
  name: string;
  eventType: string;
  subjectTemplate: string;
  isActive: boolean;
};

export function EmailTemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/email-templates");
    if (res.ok) setTemplates(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(t: Template) {
    setSelected(t);
    setSubject(t.subjectTemplate);
    fetch(`/api/email-templates/${t.id}`)
      .then((r) => r.json())
      .then((full) => {
        setHtml(full.htmlTemplate ?? "");
      });
    setSaved(false);
  }

  async function save() {
    if (!selected) return;
    await fetch(`/api/email-templates/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: selected.key,
        name: selected.name,
        eventType: selected.eventType,
        subjectTemplate: subject,
        htmlTemplate: html,
        isActive: selected.isActive,
      }),
    });
    setSaved(true);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-2">
        <h3 className="font-semibold text-navy-950">Templates</h3>
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => openEdit(t)}
            className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
              selected?.id === t.id ? "border-gold-500 bg-gold-50" : "border-navy-950/10 bg-white"
            }`}
          >
            <p className="font-medium">{t.name}</p>
            <p className="font-mono text-xs text-navy-500">{t.key}</p>
          </button>
        ))}
      </section>

      {selected && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-4">
          <h3 className="font-semibold text-navy-950">{selected.name}</h3>
          <p className="mt-1 text-xs text-navy-500">Événement : {selected.eventType}</p>
          <label className="mt-4 block text-xs font-medium text-navy-600">Sujet</label>
          <input
            className="input-sofi mt-1"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <label className="mt-4 block text-xs font-medium text-navy-600">Corps HTML</label>
          <textarea
            className="input-sofi mt-1 font-mono text-xs"
            rows={14}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
          />
          <p className="mt-2 text-xs text-navy-500">
            Variables : {"{employeeName}"}, {"{clientName}"}, {"{saleReference}"}, etc.
          </p>
          <button
            type="button"
            onClick={save}
            className="mt-4 rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Enregistrer
          </button>
          {saved && <p className="mt-2 text-sm text-emerald-700">Template enregistré.</p>}
        </section>
      )}
    </div>
  );
}
