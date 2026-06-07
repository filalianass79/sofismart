import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/rbac/has-permission";
import { WhatsAppLogsTable } from "@/components/notifications/whatsapp-logs-table";

export default async function WhatsAppLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perms = session.user.permissions ?? [];
  if (!hasPermission(perms, "whatsapp.view") && session.user.role !== "ADMIN") {
    redirect("/dashboard/notifications");
  }

  return (
    <article className="space-y-6">
      <header>
        <Link href="/dashboard/notifications" className="text-sm text-gold-700 hover:underline">
          ← Notifications
        </Link>
        <h2 className="font-display text-3xl text-navy-950">Historique WhatsApp</h2>
        <p className="mt-1 text-sm text-navy-600">Messages envoyés, statuts et relances.</p>
      </header>
      <WhatsAppLogsTable />
    </article>
  );
}
