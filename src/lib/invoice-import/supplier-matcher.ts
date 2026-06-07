import { prisma } from "@/lib/prisma";
import type { SupplierMatchResult } from "./types";
import type { StructuredInvoiceData } from "./types";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function matchSuppliers(
  structured: StructuredInvoiceData,
): Promise<SupplierMatchResult[]> {
  const name = String(structured.supplier.name.value ?? "").trim();
  const ice = String(structured.supplier.ice.value ?? "").trim();
  const phone = String(structured.supplier.phone.value ?? "").replace(/\D/g, "");

  if (!name && !ice && !phone) return [];

  const suppliers = await prisma.supplier.findMany({
    where: { isArchived: false },
    select: { id: true, name: true, ice: true, phone: true, rc: true },
    take: 500,
  });

  const results: SupplierMatchResult[] = [];
  for (const s of suppliers) {
    let score = 0;
    if (ice && s.ice && ice === s.ice) score += 0.95;
    if (phone && s.phone && phone.length >= 9 && s.phone.replace(/\D/g, "").includes(phone.slice(-9)))
      score += 0.5;
    const n1 = norm(name);
    const n2 = norm(s.name);
    if (n1 && n2) {
      if (n1 === n2) score += 0.85;
      else if (n2.includes(n1) || n1.includes(n2)) score += 0.6;
    }
    if (score >= 0.55) {
      results.push({
        id: s.id,
        name: s.name,
        ice: s.ice,
        phone: s.phone,
        score: Math.min(1, score),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}
