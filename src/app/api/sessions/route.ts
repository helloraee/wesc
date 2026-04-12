import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";

const createSchema = z.object({
  teamId: z.string().min(1),
  title: z.string().optional().nullable(),
  location: z.string().min(1),
  scheduledAt: z.string().min(1),
  durationMinutes: z.number().int().positive().default(90),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId") || "";
  const status = searchParams.get("status") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const where: Record<string, unknown> = {};
  if (teamId) where.teamId = teamId;
  if (status) where.status = status;
  if (from || to) {
    where.scheduledAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const sessions = await prisma.practiceSession.findMany({
    where,
    include: {
      team: { include: { sport: { select: { name: true } } } },
      _count: { select: { attendanceLogs: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json({ data: sessions });
}

export async function POST(req: Request) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const practiceSession = await prisma.practiceSession.create({
    data: {
      ...parsed.data,
      scheduledAt: new Date(parsed.data.scheduledAt),
      createdById: session.user.id,
    },
    include: {
      team: { include: { sport: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ data: practiceSession }, { status: 201 });
}
