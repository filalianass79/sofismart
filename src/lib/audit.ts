import { prisma } from "@/lib/prisma";
import type { AuditPayload } from "@/lib/audit-types";

export type { AuditPayload } from "@/lib/audit-types";

export async function createAuditLog(payload: AuditPayload) {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined;
    userAgent = h.get("user-agent") ?? undefined;
  } catch {
    /* hors requête HTTP */
  }

  return prisma.auditLog.create({
    data: {
      actorUserId: payload.actorUserId ?? null,
      action: payload.action,
      module: payload.module,
      targetType: payload.targetType ?? null,
      targetId: payload.targetId ?? null,
      oldValues: payload.oldValues ? (payload.oldValues as object) : undefined,
      newValues: payload.newValues ? (payload.newValues as object) : undefined,
      ipAddress,
      userAgent,
    },
  });
}
