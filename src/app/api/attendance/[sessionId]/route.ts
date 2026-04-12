import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { sessionId } = await params;

  const logs = await prisma.attendanceLog.findMany({
    where: { sessionId },
    include: {
      athlete: { select: { id: true, fullName: true, jerseyNumber: true } },
    },
    orderBy: { athlete: { fullName: "asc" } },
  });

  return NextResponse.json({ data: logs });
}
