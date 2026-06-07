import { prisma } from "@/lib/prisma";

export async function nextClientReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CLI-${year}-`;
  const last = await prisma.client.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
