import { prisma } from "@/lib/prisma";
import type {
  AppNotificationCategory,
  AppNotificationStatus,
  NotificationEventType,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import type { NotificationPayload } from "./types";
import { renderTemplate } from "./template-utils";

export async function createInternalNotification(params: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  category?: AppNotificationCategory;
  module?: string;
  eventType?: NotificationEventType;
  type?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.appNotification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      link: params.link,
      category: params.category ?? "INFO",
      module: params.module,
      eventType: params.eventType,
      type: params.type ?? params.eventType ?? "INFO",
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      status: "UNREAD",
    },
  });
}

export async function createInternalNotificationsBulk(
  userIds: string[],
  params: Omit<Parameters<typeof createInternalNotification>[0], "userId">,
) {
  const unique = [...new Set(userIds)];
  if (!unique.length) return;
  await prisma.appNotification.createMany({
    data: unique.map((userId) => ({
      userId,
      title: params.title,
      message: params.message,
      link: params.link,
      category: params.category ?? "INFO",
      module: params.module,
      eventType: params.eventType,
      type: params.type ?? params.eventType ?? "INFO",
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      status: "UNREAD" as AppNotificationStatus,
    })),
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.appNotification.count({
    where: { userId, status: "UNREAD" },
  });
}

export async function markNotificationRead(id: string, userId: string) {
  const n = await prisma.appNotification.findFirst({ where: { id, userId } });
  if (!n) return null;
  return prisma.appNotification.update({
    where: { id },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.appNotification.updateMany({
    where: { userId, status: "UNREAD" },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function archiveNotification(id: string, userId: string) {
  const n = await prisma.appNotification.findFirst({ where: { id, userId } });
  if (!n) return null;
  return prisma.appNotification.update({
    where: { id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
}

export async function deleteNotification(id: string, userId: string) {
  const n = await prisma.appNotification.findFirst({ where: { id, userId } });
  if (!n) return false;
  await prisma.appNotification.delete({ where: { id } });
  return true;
}

export async function listUserNotifications(
  userId: string,
  opts: {
    status?: AppNotificationStatus;
    module?: string;
    eventType?: NotificationEventType;
    search?: string;
    take?: number;
    skip?: number;
  },
) {
  return prisma.appNotification.findMany({
    where: {
      userId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.module ? { module: opts.module } : {}),
      ...(opts.eventType ? { eventType: opts.eventType } : {}),
      ...(opts.search
        ? {
            OR: [
              { title: { contains: opts.search, mode: "insensitive" } },
              { message: { contains: opts.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 50,
    skip: opts.skip ?? 0,
  });
}

export async function getTemplateForEvent(
  eventType: NotificationEventType,
  channel: "INTERNAL" | "WHATSAPP",
) {
  return prisma.notificationTemplate.findFirst({
    where: { eventType, channel, isActive: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function buildMessageFromTemplate(
  template: { subject?: string | null; body: string },
  payload: NotificationPayload,
) {
  const title = template.subject ? renderTemplate(template.subject, payload) : "";
  const message = renderTemplate(template.body, payload);
  return { title, message };
}
