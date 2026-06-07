import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { userEmailPreferenceSchema } from "@/lib/validations/email";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const prefs = await prisma.userEmailPreference.upsert({
    where: { userId: gate.session.user.id },
    update: {},
    create: { userId: gate.session.user.id },
  });
  return NextResponse.json(prefs);
}

export async function PUT(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const parsed = userEmailPreferenceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = {
    ...parsed.data,
    alternativeEmail: parsed.data.alternativeEmail || null,
  };
  const prefs = await prisma.userEmailPreference.upsert({
    where: { userId: gate.session.user.id },
    update: data,
    create: { userId: gate.session.user.id, ...data },
  });
  return NextResponse.json(prefs);
}
