import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const sports = await prisma.sport.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { teams: true, athletes: true } } },
  });

  return NextResponse.json({ data: sports });
}

export async function POST(req: Request) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (!session) return forbidden();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const sport = await prisma.sport.create({ data: parsed.data });
  return NextResponse.json({ data: sport }, { status: 201 });
}
