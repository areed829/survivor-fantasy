import { db } from "../db";

// Default scoring values
const DEFAULT_SCORING = {
  IMMUNITY_WIN: 2,
  REWARD_WIN: 1,
  IDOL_FOUND: 2,
  IDOL_PLAYED: 3,
  VOTED_OUT: -2,
  FINAL_TRIBAL: 5,
  WINNER: 10,
};

/**
 * Get scoring config for a season (with defaults)
 */
export function getScoringConfig(season: { scoringConfig?: any }) {
  if (season.scoringConfig && typeof season.scoringConfig === "object") {
    return { ...DEFAULT_SCORING, ...season.scoringConfig };
  }
  return DEFAULT_SCORING;
}

/**
 * Calculate score for an outcome type
 */
export function calculateOutcomeScore(
  outcomeType: string,
  scoringConfig: Record<string, number>
): number {
  return scoringConfig[outcomeType] ?? 0;
}

/**
 * Recalculate episode scores for all users in a season
 */
export async function recalculateEpisodeScores(
  seasonId: string,
  episodeId: string
) {
  const season = await db.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) {
    throw new Error("Season not found");
  }

  const scoringConfig = getScoringConfig(season);

  // Get all outcomes for this episode
  const outcomes = await db.episodeOutcome.findMany({
    where: {
      seasonId,
      episodeId,
    },
  });

  // Get all roster entries for this season
  const rosterEntries = await db.rosterEntry.findMany({
    where: { seasonId },
    include: {
      user: true,
      castaway: true,
    },
  });

  // Calculate scores per user
  const userScores = new Map<string, number>();

  for (const outcome of outcomes) {
    const score = calculateOutcomeScore(outcome.outcomeType, scoringConfig);
    
    // Find all users who have this castaway
    const usersWithCastaway = rosterEntries.filter(
      (re) => re.castawayId === outcome.castawayId
    );

    for (const rosterEntry of usersWithCastaway) {
      const currentScore = userScores.get(rosterEntry.userId) ?? 0;
      userScores.set(rosterEntry.userId, currentScore + score);
    }
  }

  // Update or create episode scores
  for (const [userId, score] of userScores.entries()) {
    await db.episodeScore.upsert({
      where: {
        userId_seasonId_episodeId: {
          userId,
          seasonId,
          episodeId,
        },
      },
      update: {
        score,
      },
      create: {
        userId,
        seasonId,
        episodeId,
        score,
      },
    });
  }

  // Set score to 0 for users with no outcomes
  const allUserIds = new Set(rosterEntries.map((re) => re.userId));
  for (const userId of allUserIds) {
    if (!userScores.has(userId)) {
      await db.episodeScore.upsert({
        where: {
          userId_seasonId_episodeId: {
            userId,
            seasonId,
            episodeId,
          },
        },
        update: {
          score: 0,
        },
        create: {
          userId,
          seasonId,
          episodeId,
          score: 0,
        },
      });
    }
  }

  return { success: true };
}

