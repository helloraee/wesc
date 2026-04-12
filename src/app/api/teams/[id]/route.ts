import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth-helpers";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["PLAYING", "PRACTICE"]).optional(),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      sport: true,
      playingAthletes: { orderBy: { fullName: "asc" } },
      practiceAthletes: {
        include: { athlete: true },
        orderBy: { athlete: { fullName: "asc" } },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: team });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER"]);
  if (!session) return forbidden();

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const team = await prisma.team.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: team });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER"]);
  if (!session) return forbidden();

  const { id } = await params;

  // Unassign athletes from this playing team
  await prisma.athlete.updateMany({
    where: { playingTeamId: id },
    data: { playingTeamId: null },
  });
  // Remove practice team associations
  await prisma.teamPracticeAthlete.deleteMany({ where: { teamId: id } });
  // Delete sessions and their attendance logs
  const sessions = await prisma.practiceSession.findMany({
    where: { teamId: id },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length > 0) {
    await prisma.attendanceLog.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.sessionNotification.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.practiceSession.deleteMany({ where: { teamId: id } });
  }
  // Delete the team
  await prisma.team.delete({ where: { id } });

  return NextResponse.json({ data: { message: "Team deleted" } });
}
