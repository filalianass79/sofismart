import { prisma } from "@/lib/prisma";

export async function nextEmployeeReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SAL-${year}-`;
  const last = await prisma.employee.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
