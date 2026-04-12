import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    athleteCount,
    teamCount,
    sessionsThisWeek,
    todaySessions,
    totalLogs,
    presentLogs,
  ] = await Promise.all([
    prisma.athlete.count({ where: { isActive: true } }),
    prisma.team.count({ where: { isActive: true } }),
    prisma.practiceSession.count({
      where: { scheduledAt: { gte: startOfWeek, lt: endOfWeek } },
    }),
    prisma.practiceSession.findMany({
      where: { scheduledAt: { gte: today, lte: endOfDay } },
      include: {
        team: { include: { sport: { select: { name: true } } } },
        _count: { select: { attendanceLogs: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.attendanceLog.count(),
    prisma.attendanceLog.count({ where: { status: "PRESENT" } }),
  ]);

  const avgAttendance =
    totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 0;

  return NextResponse.json({
    data: {
      athleteCount,
      teamCount,
      sessionsThisWeek,
      avgAttendance,
      todaySessions,
    },
  });
}
