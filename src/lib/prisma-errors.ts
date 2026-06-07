/** Codes Prisma / driver pour base injoignable (sans importer @prisma/client — safe client + serveur). */
const CONNECTION_CODES = new Set(["ECONNREFUSED", "P1000", "P1001"]);

function errorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message;
    return typeof msg === "string" ? msg : "";
  }
  return "";
}

/** Connexion PostgreSQL refusée ou base injoignable. */
export function isDatabaseConnectionError(err: unknown): boolean {
  const code = errorCode(err);
  if (code && CONNECTION_CODES.has(code)) return true;

  const msg = errorMessage(err).toLowerCase();
  return (
    msg.includes("econnrefused") ||
    msg.includes("connect econnrefused") ||
    msg.includes("connection refused") ||
    msg.includes("can't reach database") ||
    msg.includes("database server") ||
    msg.includes("prismaclientknownrequesterror")
  );
}

export function databaseConnectionMessage(err: unknown): string {
  if (!isDatabaseConnectionError(err)) {
    return err instanceof Error ? err.message : "Erreur base de données";
  }
  return (
    "PostgreSQL n’est pas accessible. Démarrez Docker Desktop, puis exécutez : npm run db:up " +
    "(port 5433). Vérifiez DATABASE_URL dans .env."
  );
}
