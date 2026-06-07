import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { hasPermission } from "@/lib/rbac/has-permission";
import { convertProformaToSale } from "@/lib/services/proforma-service";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("proformas.validate");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const perms = "permissions" in gate ? gate.permissions : [];
  const canValidateSale =
    hasPermission(perms, "ventes.validate") ||
    hasPermission(perms, "sales:*") ||
    hasPermission(perms, "*");

  try {
    const result = await convertProformaToSale(id, gate.session.user.id, canValidateSale);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
