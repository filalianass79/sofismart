import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { notificationPreferenceSchema } from "@/lib/validations/notifications";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const prefs = await prisma.userNotificationPreference.upsert({
    where: { userId: gate.session.user.id },
    update: {},
    create: { userId: gate.session.user.id },
  });
  return NextResponse.json(prefs);
}

export async function PUT(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const parsed = notificationPreferenceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const prefs = await prisma.userNotificationPreference.upsert({
    where: { userId: gate.session.user.id },
    update: parsed.data,
    create: { userId: gate.session.user.id, ...parsed.data },
  });
  return NextResponse.json(prefs);
}
