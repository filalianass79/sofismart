import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "staging", "production"]).optional(),
  APP_NAME: z.string().optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL requis"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET doit faire au moins 32 caractères").optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  APP_URL: z.string().url().optional(),
  UPLOAD_DIR: z.string().default("public/uploads"),
  UPLOAD_STORAGE: z.enum(["local", "s3"]).default("local"),
  PDF_STORAGE_PATH: z.string().default("public/uploads"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  SEED_MODE: z.enum(["demo", "staging", "production"]).optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_ADMIN_NAME: z.string().optional(),
  ENABLE_DEBUG_MODE: z.enum(["true", "false"]).optional(),
  ENABLE_MOCK_NOTIFICATIONS: z.enum(["true", "false"]).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  EMAIL_TEST_RECIPIENT: z.string().email().optional(),
  EMAIL_LOG_ONLY: z.enum(["true", "false"]).optional(),
  QR_SECRET: z.string().min(16).optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

function resolveAuthSecret(data: ServerEnv): string {
  const secret = data.AUTH_SECRET ?? data.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Configuration environnement invalide: AUTH_SECRET ou NEXTAUTH_SECRET requis (32+ caractères)");
  }
  return secret;
}

/** Variables serveur validées — ne pas importer depuis des Client Components. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuration environnement invalide: ${msg}`);
  }
  resolveAuthSecret(parsed.data);
  cached = parsed.data;
  return cached;
}

/** Secret NextAuth — AUTH_SECRET prioritaire, NEXTAUTH_SECRET en secours. */
export function getAuthSecret(): string {
  return resolveAuthSecret(getServerEnv());
}

/** URL publique de l'application (production: APP_URL ou NEXTAUTH_URL). */
export function getAppUrl(): string {
  const env = getServerEnv();
  return env.APP_URL ?? env.NEXTAUTH_URL ?? "http://localhost:3000";
}
