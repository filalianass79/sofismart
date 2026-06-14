import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { employeeSchema } from "@/lib/validations/employee";
import { nextEmployeeReference } from "@/lib/employee-reference";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("salaries.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const jobFunction = searchParams.get("function");
  const depotId = searchParams.get("depotId");

  const employees = await prisma.employee.findMany({
    where: {
      ...(status ? { status: status as "ACTIVE" | "INACTIVE" | "ARCHIVED" } : {}),
      ...(jobFunction ? { jobFunction: jobFunction as never } : {}),
      ...(depotId ? { depotId } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { cin: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { professionalEmail: { contains: q, mode: "insensitive" } },
              { reference: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { lastName: "asc" },
    include: {
      depot: { select: { id: true, name: true } },
      user: { select: { id: true, email: true, accountStatus: true, lastLoginAt: true } },
    },
  });

  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("salaries.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  if (d.cin) {
    const dup = await prisma.employee.findUnique({ where: { cin: d.cin } });
    if (dup) return NextResponse.json({ error: "CIN déjà utilisé" }, { status: 409 });
  }

  const reference = await nextEmployeeReference();
  const employee = await prisma.employee.create({
    data: {
      reference,
      firstName: d.firstName,
      lastName: d.lastName,
      cin: d.cin || null,
      personalEmail: d.personalEmail || null,
      professionalEmail: d.professionalEmail || null,
      phone: d.phone || null,
      whatsappPhone: d.whatsappPhone || null,
      whatsappEnabled: d.whatsappEnabled ?? false,
      whatsappConsent: d.whatsappConsent ?? false,
      preferredNotificationChannel: d.preferredNotificationChannel ?? "ALL",
      address: d.address || null,
      city: d.city || null,
      birthDate: d.birthDate ? new Date(d.birthDate) : null,
      hireDate: d.hireDate ? new Date(d.hireDate) : null,
      jobFunction: d.jobFunction,
      department: d.department || null,
      depotId: d.depotId || null,
      contractType: d.contractType || null,
      salary: d.salary ?? null,
      status: d.status ?? "ACTIVE",
      notes: d.notes || null,
    },
    include: { depot: true },
  });

  await createAuditLog({
    actorUserId: gate.session.user.id,
    action: "EMPLOYEE_CREATED",
    module: "salaries",
    targetType: "Employee",
    targetId: employee.id,
    newValues: { reference: employee.reference },
  });

  return NextResponse.json(employee, { status: 201 });
}
