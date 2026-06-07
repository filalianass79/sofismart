import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/rbac/has-permission";
import { NotificationSettingsPanel } from "@/components/notifications/notification-settings-panel";

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perms = session.user.permissions ?? [];
  if (!hasPermission(perms, "notifications.edit") && session.user.role !== "ADMIN") {
    redirect("/dashboard/settings");
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-navy-950">Notifications & WhatsApp</h3>
        <p className="text-sm text-navy-600">
          Activer les canaux par événement, tester WhatsApp et consulter les logs.
        </p>
      </div>
      <NotificationSettingsPanel />
    </section>
  );
}
