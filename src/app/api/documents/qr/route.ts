import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url?.startsWith("http")) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  const png = await QRCode.toBuffer(url, { width: 256, margin: 1, type: "png" });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
