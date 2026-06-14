import { prisma } from "@/lib/prisma";
import { jobFunctionLabels } from "@/lib/employee-labels";
import type { EmployeeJobFunction } from "@/generated/prisma/enums";

export type SaleCommercialOption = {
  id: string;
  name: string;
  jobFunctionLabel: string;
  reference: string;
};

/** Salariés actifs avec compte utilisateur — pour le sélecteur commercial vente. */
export async function listSaleCommercialOptions(): Promise<SaleCommercialOption[]> {
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      user: { accountStatus: "ACTIVE" },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return employees
    .filter((e) => e.user)
    .map((e) => ({
      id: e.user!.id,
      name: e.user!.name ?? `${e.firstName} ${e.lastName}`.trim(),
      jobFunctionLabel: jobFunctionLabels[e.jobFunction as EmployeeJobFunction] ?? e.jobFunction,
      reference: e.reference,
    }));
}

/** Garantit que l'utilisateur connecté apparaît dans la liste (ex. admin sans fiche salarié). */
export async function listSaleCommercialOptionsForUser(
  currentUserId?: string | null,
  currentUserName?: string | null,
): Promise<SaleCommercialOption[]> {
  const options = await listSaleCommercialOptions();
  if (!currentUserId || options.some((o) => o.id === currentUserId)) return options;
  return [
    {
      id: currentUserId,
      name: currentUserName ?? "Utilisateur connecté",
      jobFunctionLabel: "—",
      reference: "—",
    },
    ...options,
  ];
}
