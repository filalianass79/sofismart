import { LocalStorageProvider } from "./local-storage-provider";
import { S3StorageProvider } from "./s3-storage-provider";
import type { StorageProvider } from "./types";

let cached: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cached) return cached;
  const mode = (process.env.UPLOAD_STORAGE ?? "local").toLowerCase();
  cached = mode === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
  return cached;
}

export type { StorageProvider, StoredFile } from "./types";
export { LocalStorageProvider } from "./local-storage-provider";
export { S3StorageProvider } from "./s3-storage-provider";
