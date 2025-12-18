import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a test user (you'll need to replace this with actual Clerk user IDs)
  const user1 = await prisma.user.upsert({
    where: { clerkId: "user_test_1" },
    update: {},
    create: {
      clerkId: "user_test_1",
      email: "test1@example.com",
      name: "Test User 1",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { clerkId: "user_test_2" },
    update: {},
    create: {
      clerkId: "user_test_2",
      email: "test2@example.com",
      name: "Test User 2",
    },
  });

  // Create a league
  const league = await prisma.league.create({
    data: {
      name: "Sample Survivor League",
      description: "A sample league for testing",
      inviteCode: "SAMPLE01",
      memberships: {
        create: [
          {
            userId: user1.id,
            role: "COMMISSIONER",
          },
          {
            userId: user2.id,
            role: "MEMBER",
          },
        ],
      },
    },
  });

  // Create a season
  const season = await prisma.season.create({
    data: {
      leagueId: league.id,
      name: "Survivor 50",
      rosterSize: 6,
      draftType: "SNAKE",
      pickTimerSeconds: 90,
      captainEnabled: false,
      spoilerLockEnabled: true,
      status: "DRAFT",
    },
  });

  // Create castaways
  const castaways = await prisma.castaway.createMany({
    data: [
      { seasonId: season.id, name: "Alice", tribe: "Tribe A" },
      { seasonId: season.id, name: "Bob", tribe: "Tribe A" },
      { seasonId: season.id, name: "Charlie", tribe: "Tribe B" },
      { seasonId: season.id, name: "Diana", tribe: "Tribe B" },
      { seasonId: season.id, name: "Eve", tribe: "Tribe A" },
      { seasonId: season.id, name: "Frank", tribe: "Tribe B" },
      { seasonId: season.id, name: "Grace", tribe: "Tribe A" },
      { seasonId: season.id, name: "Henry", tribe: "Tribe B" },
      { seasonId: season.id, name: "Ivy", tribe: "Tribe A" },
      { seasonId: season.id, name: "Jack", tribe: "Tribe B" },
      { seasonId: season.id, name: "Kate", tribe: "Tribe A" },
      { seasonId: season.id, name: "Liam", tribe: "Tribe B" },
    ],
  });

  // Create episodes
  const episode1 = await prisma.episode.create({
    data: {
      seasonId: season.id,
      episodeNumber: 1,
      name: "Premiere",
      airDateTime: new Date("2024-01-01T20:00:00Z"),
      lockOverride: false,
    },
  });

  const episode2 = await prisma.episode.create({
    data: {
      seasonId: season.id,
      episodeNumber: 2,
      name: "Episode 2",
      airDateTime: new Date("2024-01-08T20:00:00Z"),
      lockOverride: false,
    },
  });

  console.log("Seed completed!");
  console.log(`League ID: ${league.id}`);
  console.log(`Season ID: ${season.id}`);
  console.log(`Invite Code: ${league.inviteCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

