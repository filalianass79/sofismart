"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  status: string;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications?unreadOnly=true");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    load();
  }

  const unread = items.filter((n) => n.status === "UNREAD").length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 hover:bg-navy-950/5"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-navy-700" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-morocco-600 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Fermer" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-navy-950/10 bg-white shadow-xl">
            <div className="border-b border-navy-950/10 px-4 py-3">
              <p className="font-semibold text-navy-900">Notifications</p>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-navy-500">Aucune notification</li>
              ) : (
                items.map((n) => (
                  <li key={n.id} className="border-b border-navy-950/5 last:border-0">
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => {
                          void markRead(n.id);
                          setOpen(false);
                        }}
                        className="block px-4 py-3 hover:bg-cream-50"
                      >
                        <p className="text-sm font-medium text-navy-900">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-navy-600">{n.message}</p>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="w-full px-4 py-3 text-left hover:bg-cream-50"
                      >
                        <p className="text-sm font-medium text-navy-900">{n.title}</p>
                        <p className="mt-0.5 text-xs text-navy-600">{n.message}</p>
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
            <div className="flex gap-1 border-t border-navy-950/10 p-2">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium text-gold-800 hover:bg-gold-500/10",
                )}
              >
                Voir tout
              </Link>
              <button
                type="button"
                onClick={() => {
                  void fetch("/api/notifications/read-all", { method: "PATCH" }).then(load);
                }}
                className="flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium text-navy-600 hover:bg-navy-950/5"
              >
                Tout lu
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
