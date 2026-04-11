import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return NextResponse.json({ data: { message: "Subscribed" } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
