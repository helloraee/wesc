import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER", "COACH"]),
});

export async function GET() {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (!session) return forbidden();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { managedTeams: true, coachedTeams: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: Request) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (!session) return forbidden();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists", code: "DUPLICATE" },
        { status: 409 }
      );
    }
    throw e;
  }
}
