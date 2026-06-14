"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Truck,
  CreditCard,
  FileCheck,
  ArrowRight,
  CheckCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPanel } from "@/components/dashboard/shared/dashboard-ui";

export type DashboardNotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  status: string;
  category: string;
  eventType: string | null;
  createdAt: string | Date;
};

const EVENT_LABELS: Record<string, string> = {
  SALE_VALIDATED: "Vente validée",
  SALE_VALIDATION_REQUEST: "Validation vente",
  EXIT_VOUCHER_GENERATED: "Bon de sortie",
  EXIT_VOUCHER_SENT: "Bon envoyé",
  DELIVERY_NOTE_GENERATED: "Bon de livraison",
  DELIVERY_CONFIRMED: "Livraison confirmée",
  SIGNED_DELIVERY_UPLOADED: "BL signé",
  SALES_INVOICE_GENERATED: "Facture vente",
  SALES_INVOICE_SENT_TO_CLIENT: "Facture envoyée",
  PAYMENT_RECEIVED: "Paiement reçu",
  PAYMENT_OVERDUE: "Paiement en retard",
  PURCHASE_VALIDATED: "Achat validé",
  PURCHASE_VALIDATION_REQUEST: "Validation achat",
  PURCHASE_INVOICE_IMPORTED: "Facture importée",
  VEHICLE_STOCK_ENTRY: "Entrée stock",
  VEHICLE_TRANSFERRED: "Transfert véhicule",
  ACTION_REQUIRES_VALIDATION: "Action à valider",
};

function eventIcon(eventType: string | null, category: string): LucideIcon {
  if (eventType?.includes("VALID") || eventType === "ACTION_REQUIRES_VALIDATION") return ClipboardCheck;
  if (eventType?.includes("DELIVERY") || eventType?.includes("EXIT_VOUCHER")) return Truck;
  if (eventType?.includes("PAYMENT")) return CreditCard;
  if (eventType?.includes("INVOICE") || eventType?.includes("DOCUMENT")) return FileCheck;
  if (category === "SUCCESS") return CheckCircle2;
  if (category === "WARNING" || category === "ERROR") return AlertTriangle;
  return Bell;
}

function categoryAccent(category: string, unread: boolean) {
  if (unread) return "border-l-gold-500 bg-gold-500/5";
  switch (category) {
    case "SUCCESS":
      return "border-l-emerald-500 bg-emerald-50/40";
    case "WARNING":
      return "border-l-amber-500 bg-amber-50/40";
    case "ERROR":
      return "border-l-morocco-500 bg-morocco-50/40";
    case "ACTION_REQUIRED":
      return "border-l-sky-500 bg-sky-50/40";
    default:
      return "border-l-navy-300 bg-white";
  }
}

export function DashboardNotificationsFeed({
  items,
  unreadCount,
}: {
  items: DashboardNotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();

  if (!items.length) return null;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    router.refresh();
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    router.refresh();
  }

  return (
    <DashboardPanel
      title="Notifications récentes"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""} — validations, confirmations et alertes`
          : "Validations, confirmations et alertes récentes"
      }
      action={{ href: "/dashboard/notifications", label: "Toutes les notifications" }}
    >
      <ul className="space-y-2">
        {items.map((n) => {
          const unread = n.status === "UNREAD";
          const Icon = eventIcon(n.eventType, n.category);
          const when = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr });
          const badge = n.eventType ? EVENT_LABELS[n.eventType] ?? n.eventType : null;

          const inner = (
            <div
              className={cn(
                "flex gap-3 rounded-xl border border-navy-950/8 border-l-4 p-4 transition-colors hover:border-navy-950/15",
                categoryAccent(n.category, unread),
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  unread ? "bg-gold-500/20 text-gold-800" : "bg-navy-950/5 text-navy-600",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn("text-sm text-navy-950", unread && "font-semibold")}>{n.title}</p>
                  {badge && (
                    <span className="rounded-full bg-navy-950/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy-600">
                      {badge}
                    </span>
                  )}
                  {unread && (
                    <span className="rounded-full bg-gold-500/25 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-900">
                      Nouveau
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-navy-600">{n.message}</p>
                <p className="mt-2 text-xs text-navy-400">{when}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 self-start">
                {n.link && <ArrowRight className="h-4 w-4 text-navy-400" />}
                {unread && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void markRead(n.id);
                    }}
                    className="rounded p-1.5 text-navy-500 hover:bg-navy-950/5 hover:text-navy-800"
                    title="Marquer comme lu"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );

          return (
            <li key={n.id}>
              {n.link ? (
                <Link href={n.link} className="block" onClick={() => unread && void markRead(n.id)}>
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>

      {unreadCount > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-800 hover:text-gold-900"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        </div>
      )}
    </DashboardPanel>
  );
}
