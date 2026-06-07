export type AuditPayload = {
  actorUserId?: string | null;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  oldValues?: unknown;
  newValues?: unknown;
};
