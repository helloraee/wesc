import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  jerseyNumber: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]).optional(),
  contactNumber: z.string().optional().nullable(),
  sportId: z.string().optional(),
  playingTeamId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { id } = await params;
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: {
      sport: true,
      playingTeam: true,
      practiceTeams: { include: { team: true } },
    },
  });

  if (!athlete) {
    return NextResponse.json(
      { error: "Not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: athlete });
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
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const athlete = await prisma.athlete.update({
    where: { id },
    data: parsed.data,
    include: {
      sport: { select: { name: true } },
      playingTeam: { select: { name: true } },
    },
  });

  return NextResponse.json({ data: athlete });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { id } = await params;
  await prisma.athlete.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ data: { message: "Athlete deactivated" } });
}
