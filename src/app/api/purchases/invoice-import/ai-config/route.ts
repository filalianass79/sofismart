import { NextResponse } from "next/server";
import { requirePurchaseViewAccess } from "@/lib/api-purchase-auth";
import { getAiProviderInfo } from "@/lib/invoice-import/ai-invoice-extraction-service";

export async function GET() {
  const gate = await requirePurchaseViewAccess();
  if ("response" in gate) return gate.response;
  return NextResponse.json(getAiProviderInfo());
}
