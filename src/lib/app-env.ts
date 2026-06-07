/** Environnement applicatif (dev | staging | production). */
export type AppEnvironment = "development" | "staging" | "production";

const VALID: AppEnvironment[] = ["development", "staging", "production"];

function normalizeAppEnv(raw: string | undefined): AppEnvironment {
  const v = (raw ?? "").toLowerCase();
  if (v === "staging" || v === "test") return "staging";
  if (v === "production" || v === "prod") return "production";
  if (process.env.NODE_ENV === "production" && !raw) return "production";
  return "development";
}

/** Côté serveur — lit APP_ENV puis NEXT_PUBLIC_APP_ENV. */
export function getAppEnvironment(): AppEnvironment {
  return normalizeAppEnv(process.env.APP_ENV ?? process.env.NEXT_PUBLIC_APP_ENV);
}

/** Côté client — variable publique injectée au build. */
export function getPublicAppEnvironment(): AppEnvironment {
  return normalizeAppEnv(process.env.NEXT_PUBLIC_APP_ENV);
}

export function isStagingEnvironment(): boolean {
  return getAppEnvironment() === "staging";
}

export function isProductionEnvironment(): boolean {
  return getAppEnvironment() === "production";
}

export function isDebugModeEnabled(): boolean {
  return process.env.ENABLE_DEBUG_MODE === "true" || isStagingEnvironment();
}

export function isMockNotificationsEnabled(): boolean {
  return (
    process.env.ENABLE_MOCK_NOTIFICATIONS === "true" ||
    isStagingEnvironment() ||
    process.env.EMAIL_TEST_MODE === "true" ||
    process.env.WHATSAPP_ENABLED !== "true"
  );
}

export function getAppDisplayName(): string {
  return (
    process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
    process.env.APP_NAME?.trim() ||
    "SOFISMART"
  );
}

export function getAppVersion(): string {
  return process.env.npm_package_version ?? process.env.APP_VERSION ?? "0.1.0";
}

export function getBuildId(): string {
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.BUILD_ID ?? "local";
}

export function getDeployDate(): string | null {
  return process.env.VERCEL_DEPLOYMENT_CREATED_AT ?? process.env.DEPLOY_DATE ?? null;
}

export function assertValidAppEnv(value: string): AppEnvironment {
  const env = normalizeAppEnv(value);
  if (!VALID.includes(env)) throw new Error(`APP_ENV invalide: ${value}`);
  return env;
}
