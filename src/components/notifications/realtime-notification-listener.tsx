"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

type ToastNotif = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  eventType?: string | null;
};

const POLL_MS = 5_000;
const TOAST_MS = 8_000;
const ALERT_EVENTS = new Set(["SALE_VALIDATED", "EXIT_VOUCHER_GENERATED", "SALE_VALIDATION_REQUEST"]);

function playNotificationBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
    osc.onended = () => void ctx.close();
  } catch {
    /* navigateur sans Web Audio ou autoplay bloqué */
  }
}

export function RealtimeNotificationListener() {
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  const knownIds = useRef<Set<string> | null>(null);
  const bootstrapped = useRef(false);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const poll = useCallback(async () => {
    const res = await fetch("/api/notifications?unreadOnly=true&take=20");
    if (!res.ok) return;
    const items: ToastNotif[] = await res.json();

    if (!bootstrapped.current) {
      knownIds.current = new Set(items.map((n) => n.id));
      bootstrapped.current = true;
      return;
    }

    const fresh = items.filter((n) => !knownIds.current!.has(n.id));
    if (!fresh.length) return;

    for (const n of fresh) {
      knownIds.current!.add(n.id);
    }

    const alertable = fresh.filter((n) => !n.eventType || ALERT_EVENTS.has(n.eventType));
    if (!alertable.length) {
      window.dispatchEvent(new CustomEvent("sofismart:notifications-updated"));
      return;
    }

    playNotificationBeep();
    setToasts((prev) => [...alertable.slice(0, 3), ...prev].slice(0, 5));
    window.dispatchEvent(new CustomEvent("sofismart:notifications-updated"));
  }, []);

  useEffect(() => {
    void poll();
    const interval = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), TOAST_MS));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-2xl ring-1 ring-gold-500/20"
        >
          <div className="flex items-start gap-2 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy-950">{t.title}</p>
              <p className="mt-1 line-clamp-3 text-xs text-navy-600">{t.message}</p>
              {t.link ? (
                <Link
                  href={t.link}
                  onClick={() => dismiss(t.id)}
                  className="mt-2 inline-block text-xs font-medium text-gold-800 hover:underline"
                >
                  Voir le détail →
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-1 text-navy-400 hover:bg-navy-950/5 hover:text-navy-700"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
