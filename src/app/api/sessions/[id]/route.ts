import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";

const updateSchema = z.object({
  title: z.string().optional().nullable(),
  location: z.string().optional(),
  scheduledAt: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { id } = await params;
  const practiceSession = await prisma.practiceSession.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          sport: { select: { name: true } },
          playingAthletes: { where: { isActive: true }, orderBy: { fullName: "asc" } },
          practiceAthletes: {
            include: { athlete: { select: { id: true, fullName: true, jerseyNumber: true, isActive: true } } },
          },
        },
      },
      attendanceLogs: {
        include: { athlete: { select: { id: true, fullName: true, jerseyNumber: true } } },
      },
    },
  });

  if (!practiceSession) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: practiceSession });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.scheduledAt) {
    data.scheduledAt = new Date(parsed.data.scheduledAt);
  }

  const practiceSession = await prisma.practiceSession.update({
    where: { id },
    data,
  });

  return NextResponse.json({ data: practiceSession });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER"]);
  if (!session) return unauthorized();

  const { id } = await params;

  await prisma.attendanceLog.deleteMany({ where: { sessionId: id } });
  await prisma.sessionNotification.deleteMany({ where: { sessionId: id } });
  await prisma.practiceSession.delete({ where: { id } });

  return NextResponse.json({ data: { message: "Session deleted" } });
}
