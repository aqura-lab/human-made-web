import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { buildExport } from "@/lib/account/gdpr";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const feedback = await prisma.feedback.findMany({
    where: { userId: user.id },
    select: { body: true, tag: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const data = buildExport(user, feedback);
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="human-made-data.json"',
    },
  });
}
