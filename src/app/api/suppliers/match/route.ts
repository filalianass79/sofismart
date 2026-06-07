import { NextResponse } from "next/server";
import { requirePurchaseViewAccess } from "@/lib/api-purchase-auth";
import { matchSuppliers } from "@/lib/invoice-import/supplier-matcher";
import { extractStructuredFromText } from "@/lib/invoice-import/invoice-extraction-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requirePurchaseViewAccess();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const ice = searchParams.get("ice") ?? "";
  const name = searchParams.get("name") ?? "";
  const phone = searchParams.get("phone") ?? "";

  const structured = extractStructuredFromText("");
  structured.supplier.ice.value = ice;
  structured.supplier.name.value = name;
  structured.supplier.phone.value = phone;

  const matches = await matchSuppliers(structured);
  return NextResponse.json(matches);
}
