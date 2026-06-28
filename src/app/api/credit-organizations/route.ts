import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermissionFresh } from "@/lib/api-auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { creditOrganizationSchema } from "@/lib/validations/credit-organization";

async function requireCreditOrganizationReadAccess() {
  const gate = await requireAuth();
  if ("response" in gate) return gate;
  const perms = await loadUserPermissions(prisma, gate.session.user.id);
  const allowed =
    hasPermission(perms, "parametres.view") ||
    hasPermission(perms, "ventes.create") ||
    hasPermission(perms, "ventes.edit") ||
    hasPermission(perms, "proformas.create") ||
    hasPermission(perms, "proformas.edit");
  if (!allowed) {
    return { response: NextResponse.json({ error: "Permission refusée" }, { status: 403 }) };
  }
  return gate;
}

export async function GET(req: Request) {
  const gate = await requireCreditOrganizationReadAccess();
  if ("response" in gate) return gate.response;

  const activeOnly = new URL(req.url).searchParams.get("activeOnly") === "1";
  const q = new URL(req.url).searchParams.get("q")?.trim();

  const rows = await prisma.creditOrganization.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { sales: true, proformas: true } },
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("parametres.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = creditOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = {
    ...parsed.data,
    code: parsed.data.code?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    email: parsed.data.email?.trim() || null,
    address: parsed.data.address?.trim() || null,
    city: parsed.data.city?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
  };

  try {
    const row = await prisma.creditOrganization.create({ data });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Nom ou code déjà utilisé" }, { status: 409 });
  }
}
