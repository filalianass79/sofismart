import type { StorageProvider, StoredFile } from "./types";

/**
 * Stub S3 — prêt pour production (AWS S3 / R2 / compatible).
 * Non activé tant que UPLOAD_STORAGE=s3 et credentials AWS ne sont pas configurés.
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = "s3" as const;

  async save(): Promise<StoredFile> {
    throw new Error(
      "UPLOAD_STORAGE=s3 : configurez AWS_S3_BUCKET, AWS_S3_REGION et les clés AWS. Utilisez local pour staging Vercel.",
    );
  }

  async read(): Promise<Buffer> {
    throw new Error("S3StorageProvider.read non implémenté — utilisez local en staging.");
  }
}
