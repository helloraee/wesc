import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";

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
          playingAthletes: {
            where: { isActive: true },
            select: { id: true, fullName: true, jerseyNumber: true },
            orderBy: { fullName: "asc" },
          },
        },
      },
      attendanceLogs: {
        include: {
          athlete: {
            select: { id: true, fullName: true, jerseyNumber: true },
          },
          markedBy: { select: { name: true } },
        },
        orderBy: { athlete: { fullName: "asc" } },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!practiceSession) {
    return NextResponse.json(
      { error: "Not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const logs = practiceSession.attendanceLogs;
  const roster = practiceSession.team.playingAthletes;

  const present = logs.filter((l) => l.status === "PRESENT").length;
  const late = logs.filter((l) => l.status === "LATE").length;
  const absent = logs.filter((l) => l.status === "ABSENT").length;
  const excused = logs.filter((l) => l.status === "EXCUSED").length;
  const unmarked = roster.length - logs.length;
  const attendanceRate =
    roster.length > 0
      ? Math.round(((present + late) / roster.length) * 100)
      : 0;

  return NextResponse.json({
    data: {
      session: {
        id: practiceSession.id,
        title: practiceSession.title,
        location: practiceSession.location,
        scheduledAt: practiceSession.scheduledAt,
        durationMinutes: practiceSession.durationMinutes,
        status: practiceSession.status,
        createdBy: practiceSession.createdBy.name,
        team: practiceSession.team.name,
        sport: practiceSession.team.sport.name,
      },
      summary: {
        total: roster.length,
        marked: logs.length,
        present,
        late,
        absent,
        excused,
        unmarked,
        attendanceRate,
      },
      logs: logs.map((l) => ({
        athleteId: l.athlete.id,
        fullName: l.athlete.fullName,
        jerseyNumber: l.athlete.jerseyNumber,
        status: l.status,
        reason: l.reason,
        markedBy: l.markedBy.name,
        markedAt: l.markedAt,
      })),
      unmarkedAthletes: roster.filter(
        (a) => !logs.some((l) => l.athleteId === a.id)
      ),
    },
  });
}
