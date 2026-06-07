import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAppEnvironment,
  getAppVersion,
  getBuildId,
  getDeployDate,
  isDebugModeEnabled,
  isMockNotificationsEnabled,
} from "@/lib/app-env";
import { emailProviderStatus } from "@/lib/notifications/email/email.service";
import { isWhatsAppEnabled, isWhatsAppTestMode } from "@/lib/notifications/whatsapp.provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Erreur base de données";
  }

  const email = emailProviderStatus();

  return NextResponse.json({
    status: dbOk ? "ok" : "degraded",
    app: {
      name: process.env.APP_NAME ?? "SOFISMART",
      environment: getAppEnvironment(),
      version: getAppVersion(),
      build: getBuildId(),
      deployedAt: getDeployDate(),
      nodeEnv: process.env.NODE_ENV,
    },
    database: {
      connected: dbOk,
      error: dbError,
      provider: "postgresql",
    },
    features: {
      debugMode: isDebugModeEnabled(),
      mockNotifications: isMockNotificationsEnabled(),
      uploadStorage: process.env.UPLOAD_STORAGE ?? "local",
      emailEnabled: email.enabled,
      emailTestMode: email.testMode,
      whatsappEnabled: isWhatsAppEnabled(),
      whatsappTestMode: isWhatsAppTestMode(),
    },
    criticalEnv: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasAuthSecret: Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET),
      hasAppUrl: Boolean(process.env.APP_URL ?? process.env.NEXTAUTH_URL),
    },
    responseMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  });
}
