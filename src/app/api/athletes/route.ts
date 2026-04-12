import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";

const createSchema = z.object({
  fullName: z.string().min(1),
  idCardNumber: z.string().min(1),
  jerseyNumber: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]),
  contactNumber: z.string().optional().nullable(),
  sportId: z.string().min(1),
  playingTeamId: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const sportId = searchParams.get("sportId") || "";
  const teamId = searchParams.get("teamId") || "";
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { idCardNumber: { contains: search, mode: "insensitive" } },
    ];
  }
  if (sportId) where.sportId = sportId;
  if (teamId) where.playingTeamId = teamId;
  if (active !== null && active !== "") where.isActive = active === "true";

  const athletes = await prisma.athlete.findMany({
    where,
    include: {
      sport: { select: { name: true } },
      playingTeam: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ data: athletes });
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

  try {
    const athlete = await prisma.athlete.create({
      data: parsed.data,
      include: {
        sport: { select: { name: true } },
        playingTeam: { select: { name: true } },
      },
    });
    return NextResponse.json({ data: athlete }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "ID card number already exists", code: "DUPLICATE" },
        { status: 409 }
      );
    }
    throw e;
  }
}
