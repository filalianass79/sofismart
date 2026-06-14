import { prisma } from "@/lib/prisma";
import type { NotificationEventType } from "@/generated/prisma/enums";
import { renderTemplate } from "@/lib/notifications/template-utils";

export async function getWhatsAppTemplateByKey(key: string) {
  return prisma.whatsAppTemplate.findUnique({ where: { key } });
}

export async function getWhatsAppTemplateForEvent(eventType: NotificationEventType) {
  return prisma.whatsAppTemplate.findFirst({
    where: { eventType, isActive: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function renderWhatsAppTemplateBody(
  templateKey: string,
  variables: Record<string, string | number | undefined | null> & { eventType?: NotificationEventType },
): Promise<{ body: string; templateKey: string; metaTemplateName: string | null; language: string; orderedParams: string[] } | null> {
  const tpl = templateKey
    ? await getWhatsAppTemplateByKey(templateKey)
    : variables.eventType
      ? await getWhatsAppTemplateForEvent(variables.eventType)
      : null;

  if (!tpl) return null;

  const body = renderTemplate(tpl.body, variables);
  const orderedParams = tpl.variables.map((v) => String(variables[v] ?? "—"));

  return {
    body,
    templateKey: tpl.key,
    metaTemplateName: tpl.metaTemplateName,
    language: tpl.language,
    orderedParams,
  };
}

export async function listWhatsAppTemplates() {
  return prisma.whatsAppTemplate.findMany({ orderBy: { name: "asc" } });
}

export async function upsertWhatsAppTemplate(data: {
  key: string;
  name: string;
  eventType: NotificationEventType;
  language?: string;
  metaTemplateName?: string | null;
  body: string;
  variables: string[];
  isActive?: boolean;
}) {
  return prisma.whatsAppTemplate.upsert({
    where: { key: data.key },
    update: {
      name: data.name,
      eventType: data.eventType,
      language: data.language ?? "fr",
      metaTemplateName: data.metaTemplateName ?? null,
      body: data.body,
      variables: data.variables,
      isActive: data.isActive ?? true,
    },
    create: {
      key: data.key,
      name: data.name,
      eventType: data.eventType,
      language: data.language ?? "fr",
      metaTemplateName: data.metaTemplateName ?? null,
      body: data.body,
      variables: data.variables,
      isActive: data.isActive ?? true,
    },
  });
}
