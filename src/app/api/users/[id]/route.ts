import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, forbidden } from "@/lib/auth-helpers";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER", "COACH"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (!session) return forbidden();

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.password) {
    data.passwordHash = await hash(parsed.data.password, 12);
    delete data.password;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  return NextResponse.json({ data: user });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (!session) return forbidden();

  const { id } = await params;

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // Unassign from teams, reassign attendance logs to keep history
  await prisma.team.updateMany({ where: { managerId: id }, data: { managerId: null } });
  await prisma.team.updateMany({ where: { coachId: id }, data: { coachId: null } });
  await prisma.notificationPreference.deleteMany({ where: { userId: id } });

  // Delete sessions created by this user (or reassign — for now delete)
  const sessions = await prisma.practiceSession.findMany({
    where: { createdById: id },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length > 0) {
    await prisma.attendanceLog.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.sessionNotification.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.practiceSession.deleteMany({ where: { createdById: id } });
  }

  // Delete attendance logs marked by this user
  await prisma.attendanceLog.deleteMany({ where: { markedById: id } });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ data: { message: "User deleted" } });
}
