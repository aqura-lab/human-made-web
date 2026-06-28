import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { feedbackSchema } from "@/lib/validation/schemas";
import { getCurrentUser } from "@/lib/auth/guards";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a message and pick a topic." }, { status: 400 });
  }

  await prisma.feedback.create({
    data: { userId: user.id, body: parsed.data.body, tag: parsed.data.tag },
  });
  return NextResponse.json({ ok: true });
}
