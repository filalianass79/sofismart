import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, StoredFile } from "./types";

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;

  constructor(private uploadRoot = process.env.UPLOAD_DIR ?? "public/uploads") {}

  private abs(relativePath: string) {
    return path.join(process.cwd(), this.uploadRoot, relativePath);
  }

  async save(params: { buffer: Buffer; relativePath: string }): Promise<StoredFile> {
    const abs = this.abs(params.relativePath);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, params.buffer);
    const publicPath = `/uploads/${params.relativePath.replace(/\\/g, "/")}`;
    return { publicPath, storageKey: abs, size: params.buffer.length };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(storageKey);
  }
}
