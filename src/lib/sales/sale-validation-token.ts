import { createHmac, timingSafeEqual } from "node:crypto";
import { appBaseUrl } from "@/lib/notifications/template-utils";

const PURPOSE = "sale-validation-v1";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signingSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET requis pour les liens de validation");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(`${PURPOSE}:${payload}`).digest("base64url");
}

/** Token signé : validation vente par un gérant/admin depuis un e-mail. */
export function createSaleValidationToken(
  saleId: string,
  validatorUserId: string,
  ttlMs = DEFAULT_TTL_MS,
): string {
  const exp = Date.now() + ttlMs;
  const payload = `${saleId}:${validatorUserId}:${exp}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sign(payload)}`;
}

export function verifySaleValidationToken(
  token: string,
): { saleId: string; validatorUserId: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const [saleId, validatorUserId, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!saleId || !validatorUserId || !Number.isFinite(exp) || Date.now() > exp) return null;

  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { saleId, validatorUserId };
}

export function buildSaleValidationEmailUrl(saleId: string, validatorUserId: string): string {
  const base = appBaseUrl().replace(/\/$/, "");
  const token = createSaleValidationToken(saleId, validatorUserId);
  return `${base}/api/sales/validate-from-email?token=${encodeURIComponent(token)}`;
}
