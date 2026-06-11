import Image, { type ImageProps } from "next/image";
import { normalizePublicUploadUrl } from "@/lib/storage/public-upload-url";

type UploadImageProps = Omit<ImageProps, "src" | "unoptimized"> & {
  src: string | null | undefined;
};

/** Image uploadée (/uploads/...) — servie directement, sans optimiseur Next.js. */
export function UploadImage({ src, alt = "", ...props }: UploadImageProps) {
  const normalized = normalizePublicUploadUrl(src);
  if (!normalized) return null;
  return <Image src={normalized} alt={alt} unoptimized {...props} />;
}
