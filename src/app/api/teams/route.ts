import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  sportId: z.string().min(1),
  type: z.enum(["PLAYING", "PRACTICE"]).default("PLAYING"),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]).optional().nullable(),
});

export async function GET(req: Request) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const sportId = searchParams.get("sportId") || "";

  const where: Record<string, unknown> = {};
  if (sportId) where.sportId = sportId;

  const teams = await prisma.team.findMany({
    where,
    include: {
      sport: { select: { name: true } },
      _count: { select: { playingAthletes: true, practiceAthletes: true, sessions: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: teams });
}

export async function POST(req: Request) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER"]);
  if (!session) return forbidden();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const team = await prisma.team.create({
    data: parsed.data,
    include: {
      sport: { select: { name: true } },
      _count: { select: { playingAthletes: true, practiceAthletes: true, sessions: true } },
    },
  });

  return NextResponse.json({ data: team }, { status: 201 });
}
