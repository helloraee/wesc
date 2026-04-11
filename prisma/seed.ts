import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@westendsc.mv" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@westendsc.mv",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Seeded super admin:", admin.email);

  const defaultSports = [
    { name: "Handball", slug: "handball" },
    { name: "Football", slug: "football" },
    { name: "Futsal", slug: "futsal" },
    { name: "Basketball", slug: "basketball" },
    { name: "Beach Volleyball", slug: "beach-volleyball" },
    { name: "Beach Handball", slug: "beach-handball" },
  ];

  for (const sport of defaultSports) {
    await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: {},
      create: sport,
    });
  }

  console.log("Seeded default sports:", defaultSports.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
