"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, CheckCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  status: string;
  category: string;
  module: string | null;
  eventType: string | null;
  createdAt: string;
};

export function NotificationsList({
  adminLogsLink,
  emailLogsLink,
}: {
  adminLogsLink?: string;
  emailLogsLink?: string;
}) {
  const [items, setItems] = useState<Notif[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ take: "100" });
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const res = await fetch(`/api/notifications?${params}`);
    if (res.ok) setItems(await res.json());
  }, [status, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    load();
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    load();
  }

  async function archive(id: string) {
    await fetch(`/api/notifications/${id}/archive`, { method: "PATCH" });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-sofi text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="UNREAD">Non lues</option>
          <option value="READ">Lues</option>
          <option value="ARCHIVED">Archivées</option>
        </select>
        <input
          type="search"
          placeholder="Rechercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input-sofi min-w-[200px] flex-1 text-sm"
        />
        <button
          type="button"
          onClick={markAll}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
        >
          <CheckCheck className="h-4 w-4" /> Tout marquer lu
        </button>
        {adminLogsLink && (
          <Link href={adminLogsLink} className="text-sm font-medium text-gold-800 hover:underline">
            Logs WhatsApp
          </Link>
        )}
        {emailLogsLink && (
          <Link href={emailLogsLink} className="text-sm font-medium text-gold-800 hover:underline">
            Logs email
          </Link>
        )}
      </div>

      <ul className="divide-y divide-navy-950/10 rounded-xl border border-navy-950/10 bg-white">
        {items.length === 0 ? (
          <li className="px-4 py-12 text-center text-sm text-navy-500">Aucune notification</li>
        ) : (
          items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex flex-wrap items-start justify-between gap-3 px-4 py-4",
                n.status === "UNREAD" && "bg-gold-500/5",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy-900">{n.title}</p>
                <p className="mt-1 text-sm text-navy-600">{n.message}</p>
                <p className="mt-2 text-xs text-navy-400">
                  {new Date(n.createdAt).toLocaleString("fr-FR")}
                  {n.module ? ` · ${n.module}` : ""}
                  {n.eventType ? ` · ${n.eventType}` : ""}
                </p>
                {n.link && (
                  <Link href={n.link} className="mt-2 inline-block text-sm text-gold-800 hover:underline">
                    Ouvrir →
                  </Link>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {n.status === "UNREAD" && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="rounded p-2 hover:bg-navy-950/5"
                    title="Marquer lu"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => archive(n.id)}
                  className="rounded p-2 hover:bg-navy-950/5"
                  title="Archiver"
                >
                  <Archive className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="rounded p-2 hover:bg-morocco-500/10 text-morocco-700"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
