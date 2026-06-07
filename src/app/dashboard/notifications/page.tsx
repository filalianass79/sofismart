import { NotificationsList } from "@/components/notifications/notifications-list";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/rbac/has-permission";

export default async function NotificationsPage() {
  const session = await auth();
  const perms = session?.user?.permissions ?? [];
  const showWhatsAppLogs =
    hasPermission(perms, "whatsapp.view") || session?.user?.role === "ADMIN";
  const showEmailLogs =
    hasPermission(perms, "emails.view") || session?.user?.role === "ADMIN";

  return (
    <article className="space-y-6">
      <header>
        <h2 className="font-display text-3xl text-navy-950">Notifications</h2>
        <p className="mt-1 text-sm text-navy-600">
          Historique des alertes internes — ventes, livraisons, paiements et plus.
        </p>
      </header>
      <NotificationsList
        adminLogsLink={showWhatsAppLogs ? "/dashboard/notifications/whatsapp-logs" : undefined}
        emailLogsLink={showEmailLogs ? "/dashboard/emails/logs" : undefined}
      />
    </article>
  );
}
