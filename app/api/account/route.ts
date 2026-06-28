import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateAccountSchema } from "@/lib/validation/schemas";
import { getCurrentUser } from "@/lib/auth/guards";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = updateAccountSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nothing valid to update" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
