import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { userCanValidateSales } from "@/lib/rbac/can-validate-sale";
import { validateSale } from "@/lib/services/sale-service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("ventes.validate");
  if ("response" in gate) return gate.response;

  const roleCode = gate.session.user.roleCode ?? gate.session.user.role;
  if (
    !userCanValidateSales(gate.session.user.permissions ?? [], roleCode)
  ) {
    return NextResponse.json(
      { error: "Seuls les gérants et administrateurs peuvent valider une vente." },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const sale = await validateSale(id, gate.session.user.id);
    return NextResponse.json(sale);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
