import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    // Rate limit: 5 submissions per IP per minute
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = rateLimit(`waitlist:${ip}`, 5, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

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
