import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { employeeSchema } from "@/lib/validations/employee";
import { createAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("salaries.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      depot: true,
      user: { include: { appRole: true } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!employee) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PUT(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("salaries.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      cin: d.cin || null,
      personalEmail: d.personalEmail || null,
      professionalEmail: d.professionalEmail || null,
      phone: d.phone || null,
      address: d.address || null,
      city: d.city || null,
      birthDate: d.birthDate ? new Date(d.birthDate) : null,
      hireDate: d.hireDate ? new Date(d.hireDate) : null,
      jobFunction: d.jobFunction,
      department: d.department || null,
      depotId: d.depotId || null,
      contractType: d.contractType || null,
      salary: d.salary ?? null,
      status: d.status ?? existing.status,
      notes: d.notes || null,
    },
    include: { depot: true, user: true },
  });

  await createAuditLog({
    actorUserId: gate.session.user.id,
    action: "EMPLOYEE_UPDATED",
    module: "salaries",
    targetType: "Employee",
    targetId: id,
    oldValues: { reference: existing.reference },
    newValues: { reference: employee.reference },
  });

  return NextResponse.json(employee);
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("salaries.delete");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const employee = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
  if (!employee) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (employee.user) {
    return NextResponse.json({ error: "Archiver le salarié plutôt que supprimer (compte lié)" }, { status: 400 });
  }

  await prisma.employee.delete({ where: { id } });
  await createAuditLog({
    actorUserId: gate.session.user.id,
    action: "EMPLOYEE_DELETED",
    module: "salaries",
    targetType: "Employee",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
