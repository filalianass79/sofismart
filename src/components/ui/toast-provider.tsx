"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { playErrorBeep, playSuccessBeep } from "@/lib/feedback/sounds";

export type ToastType = "error" | "success" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message: string;
};

type ToastInput = {
  type?: ToastType;
  title?: string;
  message: string;
  beep?: boolean;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_MS = 6_000;

const STYLE: Record<ToastType, { ring: string; icon: typeof AlertCircle; iconClass: string }> = {
  error: {
    ring: "ring-morocco-500/35 border-morocco-500/30",
    icon: AlertCircle,
    iconClass: "text-morocco-600",
  },
  success: {
    ring: "ring-emerald-500/35 border-emerald-500/30",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
  },
  info: {
    ring: "ring-gold-500/35 border-gold-500/30",
    icon: Info,
    iconClass: "text-gold-700",
  },
};

const DEFAULT_TITLE: Record<ToastType, string> = {
  error: "Erreur",
  success: "Succès",
  info: "Information",
};

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, beep }: ToastInput) => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [{ id, type, title: title ?? DEFAULT_TITLE[type], message }, ...prev].slice(0, 5));

      if (beep !== false) {
        if (type === "error") playErrorBeep();
        if (type === "success") playSuccessBeep();
      }

      const timer = setTimeout(() => dismiss(id), TOAST_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const showError = useCallback(
    (message: string, title?: string) => showToast({ type: "error", message, title }),
    [showToast],
  );
  const showSuccess = useCallback(
    (message: string, title?: string) => showToast({ type: "success", message, title }),
    [showToast],
  );
  const showInfo = useCallback(
    (message: string, title?: string) => showToast({ type: "info", message, title, beep: false }),
    [showToast],
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showInfo }}>
      {children}
      {toasts.length > 0 && (
        <div
          className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
          aria-live="assertive"
        >
          {toasts.map((t) => {
            const cfg = STYLE[t.type];
            const Icon = cfg.icon;
            return (
              <div
                key={t.id}
                role="alert"
                className={cn(
                  "pointer-events-auto overflow-hidden rounded-xl border bg-white shadow-2xl ring-1",
                  cfg.ring,
                )}
              >
                <div className="flex items-start gap-3 p-4">
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", cfg.iconClass)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-950">{t.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-navy-700">{t.message}</p>
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
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast doit être utilisé dans ToastProvider");
  }
  return ctx;
}
