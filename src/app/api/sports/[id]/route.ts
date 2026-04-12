import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth-helpers";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
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

  const sport = await prisma.sport.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ data: sport });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (!session) return forbidden();

  const { id } = await params;

  // Check if sport has teams or athletes
  const counts = await prisma.sport.findUnique({
    where: { id },
    include: { _count: { select: { teams: true, athletes: true } } },
  });
  if (counts && (counts._count.teams > 0 || counts._count.athletes > 0)) {
    return NextResponse.json(
      { error: "Cannot delete a sport that has teams or athletes. Remove them first.", code: "HAS_DEPENDENCIES" },
      { status: 409 }
    );
  }

  await prisma.sport.delete({ where: { id } });
  return NextResponse.json({ data: { message: "Sport deleted" } });
}
