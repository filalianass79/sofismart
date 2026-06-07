import type { Buffer } from "node:buffer";

export type StoredFile = {
  /** Chemin public (ex. /uploads/documents/xxx.pdf) */
  publicPath: string;
  /** Chemin absolu sur disque ou clé S3 */
  storageKey: string;
  size: number;
};

export interface StorageProvider {
  readonly name: "local" | "s3";
  save(params: { buffer: Buffer; relativePath: string; mimeType?: string }): Promise<StoredFile>;
  read(storageKey: string): Promise<Buffer>;
  delete?(storageKey: string): Promise<void>;
}
