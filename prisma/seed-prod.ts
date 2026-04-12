import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean all data in correct order (respecting foreign keys)
  await prisma.attendanceLog.deleteMany();
  await prisma.sessionNotification.deleteMany();
  await prisma.sessionOverride.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.recurrenceRule.deleteMany();
  await prisma.teamPracticeAthlete.deleteMany();
  await prisma.athlete.deleteMany();
  await prisma.team.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sport.deleteMany();

  console.log("Cleared all data");

  // Create super admin
  const passwordHash = await hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@westendsc.mv",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Created super admin:", admin.email);

  // Create default sports
  const defaultSports = [
    { name: "Handball", slug: "handball" },
    { name: "Football", slug: "football" },
    { name: "Futsal", slug: "futsal" },
    { name: "Basketball", slug: "basketball" },
    { name: "Beach Volleyball", slug: "beach-volleyball" },
    { name: "Beach Handball", slug: "beach-handball" },
  ];

  for (const sport of defaultSports) {
    await prisma.sport.create({ data: sport });
  }
  console.log("Created default sports:", defaultSports.length);

  console.log("\n✅ Production database ready!");
  console.log("Login: admin@westendsc.mv / admin123");
  console.log("⚠️  Change this password immediately after first login!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
