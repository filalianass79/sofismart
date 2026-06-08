import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageProvider, StoredFile } from "./types";

function s3Client(): S3Client {
  const region = process.env.AWS_S3_REGION ?? process.env.AWS_REGION ?? "eu-west-3";
  return new S3Client({
    region,
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });
}

function bucket(): string {
  const b = process.env.AWS_S3_BUCKET?.trim();
  if (!b) throw new Error("AWS_S3_BUCKET manquant");
  return b;
}

function objectKey(relativePath: string): string {
  const prefix = (process.env.AWS_S3_PREFIX ?? "uploads").replace(/\/$/, "");
  const clean = relativePath.replace(/\\/g, "/").replace(/^\//, "");
  return `${prefix}/${clean}`;
}

function publicUrl(key: string): string {
  const base = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  const region = process.env.AWS_S3_REGION ?? process.env.AWS_REGION ?? "eu-west-3";
  return `https://${bucket()}.s3.${region}.amazonaws.com/${key}`;
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export class S3StorageProvider implements StorageProvider {
  readonly name = "s3" as const;

  async save(params: {
    buffer: Buffer;
    relativePath: string;
    mimeType?: string;
  }): Promise<StoredFile> {
    const key = objectKey(params.relativePath);
    await s3Client().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType,
      }),
    );
    const publicPath = `/uploads/${params.relativePath.replace(/\\/g, "/")}`;
    return { publicPath, storageKey: key, size: params.buffer.length };
  }

  async read(storageKey: string): Promise<Buffer> {
    const res = await s3Client().send(
      new GetObjectCommand({ Bucket: bucket(), Key: storageKey }),
    );
    return bodyToBuffer(res.Body);
  }

  async delete(storageKey: string): Promise<void> {
    await s3Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: storageKey }));
  }
}

/** Lit un fichier depuis S3 via sa clé objet ou un chemin public /uploads/... */
export async function readFromS3(publicOrKeyPath: string): Promise<Buffer | null> {
  if (process.env.UPLOAD_STORAGE !== "s3") return null;
  try {
    const provider = new S3StorageProvider();
    let key = publicOrKeyPath.replace(/\\/g, "/");
    if (key.startsWith("/uploads/")) {
      key = objectKey(key.slice("/uploads/".length));
    } else if (!key.includes("/") || key.startsWith("uploads/")) {
      key = key.startsWith("uploads/") ? key : objectKey(key);
    }
    return await provider.read(key);
  } catch {
    return null;
  }
}

export { objectKey, publicUrl as s3PublicUrl };
