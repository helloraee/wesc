import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";

const markSchema = z.object({
  sessionId: z.string().min(1),
  athleteId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  reason: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const body = await req.json();
  const parsed = markSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const log = await prisma.attendanceLog.upsert({
    where: {
      sessionId_athleteId: {
        sessionId: parsed.data.sessionId,
        athleteId: parsed.data.athleteId,
      },
    },
    update: {
      status: parsed.data.status,
      reason: parsed.data.reason ?? null,
      markedById: session.user.id,
    },
    create: {
      sessionId: parsed.data.sessionId,
      athleteId: parsed.data.athleteId,
      status: parsed.data.status,
      reason: parsed.data.reason ?? null,
      markedById: session.user.id,
    },
  });

  return NextResponse.json({ data: log });
}
