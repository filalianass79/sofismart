import { prisma } from "@/lib/prisma";
import type { CompanyProfileInput } from "@/lib/validations/company-profile";

const DEFAULT_ID = "default";

export async function getCompanyProfile() {
  return prisma.companyProfile.upsert({
    where: { id: DEFAULT_ID },
    update: {},
    create: {
      id: DEFAULT_ID,
      legalName: "SOFISMART",
      tradeName: "SOFISMART",
      country: "Maroc",
    },
  });
}

export async function updateCompanyProfile(data: CompanyProfileInput) {
  return prisma.companyProfile.upsert({
    where: { id: DEFAULT_ID },
    update: data,
    create: { id: DEFAULT_ID, ...data },
  });
}

export async function updateCompanyAsset(
  field: "logoUrl" | "headerImageUrl" | "footerImageUrl",
  path: string | null
) {
  await getCompanyProfile();
  return prisma.companyProfile.update({
    where: { id: DEFAULT_ID },
    data: { [field]: path },
  });
}
