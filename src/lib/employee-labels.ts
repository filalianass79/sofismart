import type { EmployeeJobFunction, EmployeeStatus, AccountStatus } from "@/generated/prisma/enums";

export const jobFunctionLabels: Record<EmployeeJobFunction, string> = {
  ADMINISTRATEUR: "Administrateur",
  GERANT: "Gérant",
  DIRECTEUR: "Directeur",
  COMMERCIAL: "Commercial",
  EMPLOYE: "Employé",
  CHAUFFEUR: "Chauffeur",
  MAGASINIER: "Magasinier",
  COMPTABLE: "Comptable",
  RESPONSABLE_DEPOT: "Responsable dépôt",
  AUTRE: "Autre",
};

export const employeeStatusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  ARCHIVED: "Archivé",
};

export const accountStatusLabels: Record<AccountStatus, string> = {
  ACTIVE: "Actif",
  DISABLED: "Désactivé",
  PENDING: "En attente",
  BLOCKED: "Bloqué",
};
