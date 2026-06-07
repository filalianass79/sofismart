import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { companyProfileSchema } from "@/lib/validations/company-profile";
import { getCompanyProfile, updateCompanyProfile } from "@/lib/services/company-profile-service";

export async function GET() {
  const gate = await requirePermissionFresh("parametres.view");
  if ("response" in gate) return gate.response;

  const profile = await getCompanyProfile();
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const gate = await requirePermissionFresh("parametres.edit");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = companyProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = {
    ...parsed.data,
    tradeName: parsed.data.tradeName || null,
    email: parsed.data.email || null,
  };

  const profile = await updateCompanyProfile(data);
  return NextResponse.json(profile);
}
