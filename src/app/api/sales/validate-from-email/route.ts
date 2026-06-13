import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import { userCanValidateSales } from "@/lib/rbac/can-validate-sale";
import { validateSale } from "@/lib/services/sale-service";
import { verifySaleValidationToken } from "@/lib/sales/sale-validation-token";
import { appBaseUrl } from "@/lib/notifications/template-utils";

function redirect(path: string) {
  const base = appBaseUrl().replace(/\/$/, "");
  return NextResponse.redirect(`${base}${path.startsWith("/") ? path : `/${path}`}`);
}

async function saleRef(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: { reference: true },
  });
  return sale?.reference;
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return redirect("/sale-validation?outcome=invalid");

  const parsed = verifySaleValidationToken(token);
  if (!parsed) return redirect("/sale-validation?outcome=expired");

  const { saleId, validatorUserId } = parsed;
  const reference = (await saleRef(saleId)) ?? "";
  const refParam = reference ? `&ref=${encodeURIComponent(reference)}` : "";

  const user = await prisma.user.findUnique({
    where: { id: validatorUserId },
    include: { appRole: { select: { code: true } } },
  });
  if (!user || user.accountStatus !== "ACTIVE") {
    return redirect(`/sale-validation?outcome=unauthorized${refParam}`);
  }

  const permissions = await loadUserPermissions(prisma, validatorUserId);
  const roleCode = user.appRole?.code ?? user.role;
  if (!userCanValidateSales(permissions, roleCode)) {
    return redirect(`/sale-validation?outcome=unauthorized${refParam}`);
  }

  try {
    await validateSale(saleId, validatorUserId);
    return redirect(`/sale-validation?outcome=success${refParam}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur validation";
    if (/déjà validée/i.test(message)) {
      return redirect(`/sale-validation?outcome=already${refParam}`);
    }
    return redirect(
      `/sale-validation?outcome=error${refParam}&message=${encodeURIComponent(message)}`,
    );
  }
}
