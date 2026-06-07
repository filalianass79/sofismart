import type { NotificationPayload } from "./types";

export function renderTemplate(body: string, payload: NotificationPayload): string {
  let out = body;
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue;
    const re = new RegExp(`\\{${key}\\}`, "g");
    out = out.replace(re, String(value));
  }
  return out;
}

export function appBaseUrl(): string {
  return (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
