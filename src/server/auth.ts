import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

/**
 * Get or create user from Clerk
 */
export async function getOrCreateUser() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  
  // Upsert user
  const user = await db.user.upsert({
    where: { clerkId: userId },
    update: {
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? null,
      name: clerkUser?.firstName && clerkUser?.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser?.username ?? null,
    },
    create: {
      clerkId: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? null,
      name: clerkUser?.firstName && clerkUser?.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser?.username ?? null,
    },
  });

  return user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getOrCreateUser();
  return user;
}

/**
 * Require user to be a member of a league
 */
export async function requireLeagueMember(leagueId: string) {
  const user = await requireAuth();
  
  const membership = await db.leagueMembership.findUnique({
    where: {
      leagueId_userId: {
        leagueId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("Not a member of this league");
  }

  return { user, membership };
}

/**
 * Require user to be a commissioner of a league
 */
export async function requireCommissioner(leagueId: string) {
  const { user, membership } = await requireLeagueMember(leagueId);
  
  if (membership.role !== "COMMISSIONER") {
    throw new Error("Not a commissioner of this league");
  }

  return { user, membership };
}

