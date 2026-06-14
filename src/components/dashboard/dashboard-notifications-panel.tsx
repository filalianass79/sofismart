import { getDashboardNotifications } from "@/lib/notifications/notification.service";
import { DashboardNotificationsFeed } from "@/components/dashboard/dashboard-notifications-feed";
import { DatabaseUnavailable } from "@/components/dashboard/database-unavailable";
import { databaseConnectionMessage, isDatabaseConnectionError } from "@/lib/prisma-errors";

export async function DashboardNotificationsPanel({ userId }: { userId: string }) {
  if (!userId) return null;

  try {
    const { items, unreadCount } = await getDashboardNotifications(userId, 8);
    if (!items.length) return null;

    return (
      <DashboardNotificationsFeed
        unreadCount={unreadCount}
        items={items.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          link: n.link,
          status: n.status,
          category: n.category,
          eventType: n.eventType,
          createdAt: n.createdAt,
        }))}
      />
    );
  } catch (err) {
    if (isDatabaseConnectionError(err)) {
      return <DatabaseUnavailable message={databaseConnectionMessage(err)} />;
    }
    throw err;
  }
}
