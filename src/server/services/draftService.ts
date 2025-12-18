import { db } from "../db";
import type { Season, Draft, DraftPick, User } from "@prisma/client";

/**
 * Get or create draft for a season
 */
export async function getOrCreateDraft(seasonId: string) {
  let draft = await db.draft.findUnique({
    where: { seasonId },
    include: {
      picks: {
        include: {
          user: true,
          castaway: true,
        },
        orderBy: { pickNumber: "asc" },
      },
    },
  });

  if (!draft) {
    draft = await db.draft.create({
      data: {
        seasonId,
        status: "PENDING",
        currentPickNumber: 1,
      },
      include: {
        picks: {
          include: {
            user: true,
            castaway: true,
          },
          orderBy: { pickNumber: "asc" },
        },
      },
    });
  }

  return draft;
}

/**
 * Get draft order for snake draft
 */
export function getDraftOrder(userIds: string[], totalPicks: number): string[] {
  const order: string[] = [];
  let forward = true;

  for (let round = 0; round < totalPicks; round += userIds.length) {
    const roundUsers = forward ? [...userIds] : [...userIds].reverse();
    order.push(...roundUsers);
    forward = !forward;
  }

  return order.slice(0, totalPicks);
}

/**
 * Get current picker for draft
 */
export function getCurrentPicker(
  draft: Draft & { picks: DraftPick[] },
  userIds: string[]
): string | null {
  if (draft.status === "COMPLETED") {
    return null;
  }

  const totalPicks = userIds.length * (draft as any).season?.rosterSize ?? 0;
  if (draft.currentPickNumber > totalPicks) {
    return null;
  }

  const order = getDraftOrder(userIds, totalPicks);
  return order[draft.currentPickNumber - 1] ?? null;
}

/**
 * Make a draft pick
 */
export async function makeDraftPick(
  draftId: string,
  userId: string,
  castawayId: string
) {
  const draft = await db.draft.findUnique({
    where: { id: draftId },
    include: {
      picks: true,
      season: {
        include: {
          league: {
            include: {
              memberships: true,
            },
          },
        },
      },
    },
  });

  if (!draft) {
    throw new Error("Draft not found");
  }

  if (draft.status === "COMPLETED") {
    throw new Error("Draft is already completed");
  }

  // Check if castaway already picked
  const alreadyPicked = draft.picks.some((p) => p.castawayId === castawayId);
  if (alreadyPicked) {
    throw new Error("Castaway already picked");
  }

  // Check if it's user's turn
  const userIds = draft.season.league.memberships.map((m) => m.userId);
  const currentPicker = getCurrentPicker(draft as any, userIds);
  if (currentPicker !== userId) {
    throw new Error("Not your turn");
  }

  // Check roster size
  const userPicks = draft.picks.filter((p) => p.userId === userId);
  if (userPicks.length >= draft.season.rosterSize) {
    throw new Error("Roster is full");
  }

  const pickNumber = draft.currentPickNumber;
  const totalPicks = userIds.length * draft.season.rosterSize;

  // Create pick
  await db.draftPick.create({
    data: {
      draftId,
      userId,
      castawayId,
      pickNumber,
    },
  });

  // Create roster entry
  await db.rosterEntry.create({
    data: {
      userId,
      seasonId: draft.seasonId,
      castawayId,
      isCaptain: false,
    },
  });

  // Update draft
  const isComplete = pickNumber >= totalPicks;
  await db.draft.update({
    where: { id: draftId },
    data: {
      currentPickNumber: pickNumber + 1,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      currentUserId: isComplete ? null : getCurrentPicker(
        { ...draft, currentPickNumber: pickNumber + 1 } as any,
        userIds
      ),
    },
  });

  return { success: true, isComplete };
}

