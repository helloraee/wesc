import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("admin123", 12);
  const coachPassword = await hash("coach123", 12);

  // ─── USERS ──────────────────────────────────────────
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

  const coach1 = await prisma.user.upsert({
    where: { email: "ahmed.rasheed@westendsc.mv" },
    update: {},
    create: {
      name: "Ahmed Rasheed",
      email: "ahmed.rasheed@westendsc.mv",
      passwordHash: coachPassword,
      role: "COACH",
    },
  });

  const coach2 = await prisma.user.upsert({
    where: { email: "mariyam.ali@westendsc.mv" },
    update: {},
    create: {
      name: "Mariyam Ali",
      email: "mariyam.ali@westendsc.mv",
      passwordHash: coachPassword,
      role: "COACH",
    },
  });

  const manager1 = await prisma.user.upsert({
    where: { email: "ibrahim.naseem@westendsc.mv" },
    update: {},
    create: {
      name: "Ibrahim Naseem",
      email: "ibrahim.naseem@westendsc.mv",
      passwordHash: coachPassword,
      role: "TEAM_MANAGER",
    },
  });

  const manager2 = await prisma.user.upsert({
    where: { email: "fathimath.shafia@westendsc.mv" },
    update: {},
    create: {
      name: "Fathimath Shafia",
      email: "fathimath.shafia@westendsc.mv",
      passwordHash: coachPassword,
      role: "TEAM_MANAGER",
    },
  });

  console.log("Seeded users:", 5);

  // ─── SPORTS ─────────────────────────────────────────
  const sportsData = [
    { name: "Handball", slug: "handball" },
    { name: "Football", slug: "football" },
    { name: "Futsal", slug: "futsal" },
    { name: "Basketball", slug: "basketball" },
    { name: "Beach Volleyball", slug: "beach-volleyball" },
    { name: "Beach Handball", slug: "beach-handball" },
  ];

  const sports: Record<string, string> = {};
  for (const s of sportsData) {
    const sport = await prisma.sport.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
    sports[s.slug] = sport.id;
  }
  console.log("Seeded sports:", Object.keys(sports).length);

  // ─── TEAMS ──────────────────────────────────────────
  const teamsData = [
    { name: "Men's Handball A", sportSlug: "handball", type: "PLAYING" as const, gender: "MALE" as const, managerId: manager1.id, coachId: coach1.id },
    { name: "Women's Handball A", sportSlug: "handball", type: "PLAYING" as const, gender: "FEMALE" as const, managerId: manager2.id, coachId: coach2.id },
    { name: "Handball Practice Squad", sportSlug: "handball", type: "PRACTICE" as const, gender: "MIXED" as const, coachId: coach1.id },
    { name: "Men's Football A", sportSlug: "football", type: "PLAYING" as const, gender: "MALE" as const, managerId: manager1.id, coachId: coach1.id },
    { name: "Women's Football A", sportSlug: "football", type: "PLAYING" as const, gender: "FEMALE" as const, managerId: manager2.id, coachId: coach2.id },
    { name: "Futsal Team", sportSlug: "futsal", type: "PLAYING" as const, gender: "MALE" as const, coachId: coach1.id },
    { name: "Basketball 3x3", sportSlug: "basketball", type: "PLAYING" as const, gender: "MIXED" as const, coachId: coach2.id },
    { name: "Beach Volleyball A", sportSlug: "beach-volleyball", type: "PLAYING" as const, gender: "MIXED" as const, coachId: coach1.id },
  ];

  const teams: Record<string, string> = {};
  for (const t of teamsData) {
    const team = await prisma.team.upsert({
      where: { id: teams[t.name] || "none" },
      update: {},
      create: {
        name: t.name,
        sportId: sports[t.sportSlug],
        type: t.type,
        gender: t.gender,
        managerId: t.managerId,
        coachId: t.coachId,
      },
    });
    teams[t.name] = team.id;
  }
  console.log("Seeded teams:", Object.keys(teams).length);

  // ─── ATHLETES ───────────────────────────────────────
  const maleFirstNames = [
    "Mohamed", "Ahmed", "Ali", "Hassan", "Ibrahim",
    "Hussain", "Yoosuf", "Ismail", "Adam", "Abdulla",
    "Nashid", "Riyaz", "Farhan", "Shifan", "Amir",
    "Naufal", "Shameel", "Akram", "Zayan", "Raif",
    "Maish", "Layaan", "Aariz", "Shaan", "Hamza",
  ];
  const femaleFirstNames = [
    "Aishath", "Mariyam", "Fathimath", "Aminath", "Hawwa",
    "Khadija", "Nishama", "Sana", "Laila", "Zeena",
    "Shaima", "Naura", "Rafa", "Hana", "Yasmin",
    "Samha", "Inaya", "Amal", "Noor", "Reesha",
  ];
  const lastNames = [
    "Rasheed", "Waheed", "Naseem", "Shareef", "Saeed",
    "Moosa", "Haleem", "Hameed", "Zahir", "Faiz",
    "Adnan", "Naeem", "Jameel", "Shafeeq", "Rizwan",
  ];

  function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateIdCard(): string {
    return `A${String(Math.floor(Math.random() * 900000) + 100000)}`;
  }

  function generatePhone(): string {
    return `+960 ${Math.floor(Math.random() * 9000000) + 1000000}`;
  }

  // Create 50 male athletes
  const maleAthletes = [];
  for (let i = 0; i < 50; i++) {
    const name = `${randomFrom(maleFirstNames)} ${randomFrom(lastNames)}`;
    const athlete = await prisma.athlete.create({
      data: {
        fullName: name,
        idCardNumber: generateIdCard(),
        jerseyNumber: String(i + 1),
        gender: "MALE",
        contactNumber: generatePhone(),
        sportId: randomFrom([sports["handball"], sports["football"], sports["futsal"], sports["basketball"]]),
      },
    });
    maleAthletes.push(athlete);
  }

  // Create 30 female athletes
  const femaleAthletes = [];
  for (let i = 0; i < 30; i++) {
    const name = `${randomFrom(femaleFirstNames)} ${randomFrom(lastNames)}`;
    const athlete = await prisma.athlete.create({
      data: {
        fullName: name,
        idCardNumber: generateIdCard(),
        jerseyNumber: String(i + 1),
        gender: "FEMALE",
        contactNumber: generatePhone(),
        sportId: randomFrom([sports["handball"], sports["football"], sports["beach-volleyball"]]),
      },
    });
    femaleAthletes.push(athlete);
  }

  console.log("Seeded athletes:", maleAthletes.length + femaleAthletes.length);

  // ─── ASSIGN ATHLETES TO TEAMS ───────────────────────
  // Men's Handball A — 14 players
  const handballMaleAthletes = maleAthletes.filter(
    (a) => a.sportId === sports["handball"]
  );
  for (const a of handballMaleAthletes.slice(0, 14)) {
    await prisma.athlete.update({
      where: { id: a.id },
      data: { playingTeamId: teams["Men's Handball A"] },
    });
  }

  // Women's Handball A — 14 players
  const handballFemaleAthletes = femaleAthletes.filter(
    (a) => a.sportId === sports["handball"]
  );
  for (const a of handballFemaleAthletes.slice(0, 14)) {
    await prisma.athlete.update({
      where: { id: a.id },
      data: { playingTeamId: teams["Women's Handball A"] },
    });
  }

  // Men's Football A — 16 players
  const footballMaleAthletes = maleAthletes.filter(
    (a) => a.sportId === sports["football"]
  );
  for (const a of footballMaleAthletes.slice(0, 16)) {
    await prisma.athlete.update({
      where: { id: a.id },
      data: { playingTeamId: teams["Men's Football A"] },
    });
  }

  // Women's Football A
  const footballFemaleAthletes = femaleAthletes.filter(
    (a) => a.sportId === sports["football"]
  );
  for (const a of footballFemaleAthletes.slice(0, 14)) {
    await prisma.athlete.update({
      where: { id: a.id },
      data: { playingTeamId: teams["Women's Football A"] },
    });
  }

  // Futsal — 10 players
  const futsalAthletes = maleAthletes.filter(
    (a) => a.sportId === sports["futsal"]
  );
  for (const a of futsalAthletes.slice(0, 10)) {
    await prisma.athlete.update({
      where: { id: a.id },
      data: { playingTeamId: teams["Futsal Team"] },
    });
  }

  // Basketball 3x3 — 6 players
  const basketballAthletes = maleAthletes.filter(
    (a) => a.sportId === sports["basketball"]
  );
  for (const a of basketballAthletes.slice(0, 6)) {
    await prisma.athlete.update({
      where: { id: a.id },
      data: { playingTeamId: teams["Basketball 3x3"] },
    });
  }

  console.log("Assigned athletes to teams");

  // ─── SESSIONS (past, today, future) ─────────────────
  const now = new Date();
  const sessionEntries = [];

  // Past sessions (last 14 days)
  for (let daysAgo = 14; daysAgo >= 1; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    // Morning handball session
    if (daysAgo % 2 === 0) {
      date.setHours(7, 0, 0, 0);
      sessionEntries.push({
        teamId: teams["Men's Handball A"],
        title: "Morning Training",
        location: "Social Center Court",
        scheduledAt: new Date(date),
        durationMinutes: 90,
        status: "COMPLETED" as const,
        createdById: coach1.id,
      });
    }

    // Evening football session
    if (daysAgo % 3 === 0) {
      date.setHours(18, 0, 0, 0);
      sessionEntries.push({
        teamId: teams["Men's Football A"],
        title: "Evening Practice",
        location: "Maafannu Ground",
        scheduledAt: new Date(date),
        durationMinutes: 120,
        status: "COMPLETED" as const,
        createdById: coach1.id,
      });
    }

    // Women's handball
    if (daysAgo % 2 === 1) {
      date.setHours(16, 30, 0, 0);
      sessionEntries.push({
        teamId: teams["Women's Handball A"],
        title: "Afternoon Session",
        location: "Social Center Court",
        scheduledAt: new Date(date),
        durationMinutes: 90,
        status: "COMPLETED" as const,
        createdById: coach2.id,
      });
    }
  }

  // Today's sessions
  const today = new Date(now);
  today.setHours(7, 0, 0, 0);
  sessionEntries.push({
    teamId: teams["Men's Handball A"],
    title: "Morning Drill",
    location: "Social Center Court",
    scheduledAt: new Date(today),
    durationMinutes: 90,
    status: "SCHEDULED" as const,
    createdById: coach1.id,
  });

  const todayEvening = new Date(now);
  todayEvening.setHours(18, 0, 0, 0);
  sessionEntries.push({
    teamId: teams["Men's Football A"],
    title: "Match Prep",
    location: "Maafannu Ground",
    scheduledAt: new Date(todayEvening),
    durationMinutes: 120,
    status: "SCHEDULED" as const,
    createdById: coach1.id,
  });

  const todayAfternoon = new Date(now);
  todayAfternoon.setHours(16, 0, 0, 0);
  sessionEntries.push({
    teamId: teams["Women's Handball A"],
    title: "Tactical Review",
    location: "Social Center Court",
    scheduledAt: new Date(todayAfternoon),
    durationMinutes: 90,
    status: "SCHEDULED" as const,
    createdById: coach2.id,
  });

  // Future sessions (next 7 days)
  for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
    const date = new Date(now);
    date.setDate(date.getDate() + daysAhead);

    date.setHours(7, 0, 0, 0);
    sessionEntries.push({
      teamId: teams["Men's Handball A"],
      title: daysAhead <= 3 ? "Pre-match Training" : "Regular Training",
      location: "Social Center Court",
      scheduledAt: new Date(date),
      durationMinutes: 90,
      status: "SCHEDULED" as const,
      createdById: coach1.id,
    });

    if (daysAhead % 2 === 0) {
      date.setHours(17, 30, 0, 0);
      sessionEntries.push({
        teamId: teams["Futsal Team"],
        title: "Futsal Practice",
        location: "Indoor Court",
        scheduledAt: new Date(date),
        durationMinutes: 60,
        status: "SCHEDULED" as const,
        createdById: coach1.id,
      });
    }
  }

  const createdSessions = [];
  for (const s of sessionEntries) {
    const session = await prisma.practiceSession.create({ data: s });
    createdSessions.push(session);
  }
  console.log("Seeded sessions:", createdSessions.length);

  // ─── ATTENDANCE LOGS (for completed sessions) ───────
  const completedSessions = createdSessions.filter(
    (s) => s.status === "COMPLETED"
  );

  let totalLogs = 0;
  for (const session of completedSessions) {
    // Get athletes on this team
    const teamAthletes = await prisma.athlete.findMany({
      where: { playingTeamId: session.teamId, isActive: true },
    });

    for (const athlete of teamAthletes) {
      const rand = Math.random();
      let status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
      let reason: string | null = null;

      if (rand < 0.72) {
        status = "PRESENT";
      } else if (rand < 0.82) {
        status = "LATE";
      } else if (rand < 0.92) {
        status = "ABSENT";
        reason = randomFrom([
          "Sick",
          "Work commitment",
          "Family emergency",
          "Travel",
          "Injury",
          null,
        ]);
      } else {
        status = "EXCUSED";
        reason = randomFrom([
          "Doctor appointment",
          "Exam",
          "Pre-approved leave",
          "National team duty",
        ]);
      }

      await prisma.attendanceLog.create({
        data: {
          sessionId: session.id,
          athleteId: athlete.id,
          status,
          reason,
          markedById: admin.id,
        },
      });
      totalLogs++;
    }
  }
  console.log("Seeded attendance logs:", totalLogs);

  console.log("\n✅ Demo data seeded successfully!");
  console.log("─────────────────────────────────");
  console.log("Login credentials:");
  console.log("  Super Admin: admin@westendsc.mv / admin123");
  console.log("  Coach:       ahmed.rasheed@westendsc.mv / coach123");
  console.log("  Coach:       mariyam.ali@westendsc.mv / coach123");
  console.log("  Manager:     ibrahim.naseem@westendsc.mv / coach123");
  console.log("  Manager:     fathimath.shafia@westendsc.mv / coach123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
