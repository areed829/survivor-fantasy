import { db } from "../db";

/**
 * Check if episode is locked due to spoiler protection
 */
export async function isEpisodeLocked(episodeId: string): Promise<boolean> {
  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    include: {
      season: true,
    },
  });

  if (!episode) {
    throw new Error("Episode not found");
  }

  // If override is enabled, never lock
  if (episode.lockOverride) {
    return false;
  }

  // If spoiler lock is disabled for season, never lock
  if (!episode.season.spoilerLockEnabled) {
    return false;
  }

  // Check if air date has passed
  const now = new Date();
  return episode.airDateTime > now;
}

/**
 * Validate that episode is not locked before allowing outcome entry
 */
export async function validateEpisodeNotLocked(episodeId: string) {
  const locked = await isEpisodeLocked(episodeId);
  if (locked) {
    throw new Error(
      "Episode is locked until after air date. Commissioner can override."
    );
  }
}

