import { z } from "zod";
import { router, commissionerProcedure, leagueMemberProcedure } from "../trpc";
import { validateEpisodeNotLocked } from "../services/spoilerLockService";
import { recalculateEpisodeScores } from "../services/scoringService";

const outcomeTypeSchema = z.enum([
  "IMMUNITY_WIN",
  "REWARD_WIN",
  "IDOL_FOUND",
  "IDOL_PLAYED",
  "VOTED_OUT",
  "FINAL_TRIBAL",
  "WINNER",
]);

export const scoringRouter = router({
  // Create episode outcome (commissioner only)
  createOutcome: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        seasonId: z.string(),
        episodeId: z.string(),
        castawayId: z.string(),
        outcomeType: outcomeTypeSchema,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, ...outcomeData } = input;

      // Check spoiler lock (unless commissioner override)
      const episode = await ctx.db.episode.findUnique({
        where: { id: input.episodeId },
      });

      if (!episode) {
        throw new Error("Episode not found");
      }

      if (!episode.lockOverride) {
        await validateEpisodeNotLocked(input.episodeId);
      }

      const outcome = await ctx.db.episodeOutcome.create({
        data: {
          seasonId: input.seasonId,
          episodeId: input.episodeId,
          castawayId: input.castawayId,
          outcomeType: input.outcomeType,
          notes: input.notes,
        },
        include: {
          castaway: true,
          episode: true,
        },
      });

      // Recalculate scores
      await recalculateEpisodeScores(input.seasonId, input.episodeId);

      return outcome;
    }),

  // Delete episode outcome (commissioner only)
  deleteOutcome: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        outcomeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const outcome = await ctx.db.episodeOutcome.findUnique({
        where: { id: input.outcomeId },
      });

      if (!outcome) {
        throw new Error("Outcome not found");
      }

      await ctx.db.episodeOutcome.delete({
        where: { id: input.outcomeId },
      });

      // Recalculate scores
      await recalculateEpisodeScores(outcome.seasonId, outcome.episodeId);

      return { success: true };
    }),

  // Get episode scores
  getEpisodeScores: leagueMemberProcedure
    .input(
      z.object({
        leagueId: z.string(),
        seasonId: z.string(),
        episodeId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const scores = await ctx.db.episodeScore.findMany({
        where: {
          seasonId: input.seasonId,
          episodeId: input.episodeId,
        },
        include: {
          user: true,
          episode: true,
        },
        orderBy: { score: "desc" },
      });

      return scores;
    }),

  // Get season standings (cumulative scores)
  getStandings: leagueMemberProcedure
    .input(
      z.object({
        leagueId: z.string(),
        seasonId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all episode scores for this season
      const scores = await ctx.db.episodeScore.findMany({
        where: {
          seasonId: input.seasonId,
        },
        include: {
          user: true,
          episode: {
            orderBy: { episodeNumber: "asc" },
          },
        },
        orderBy: [
          { userId: "asc" },
          { episode: { episodeNumber: "asc" } },
        ],
      });

      // Calculate totals and per-episode breakdown
      const standings = new Map();
      for (const score of scores) {
        if (!standings.has(score.userId)) {
          standings.set(score.userId, {
            user: score.user,
            totalScore: 0,
            episodeScores: [],
          });
        }
        const entry = standings.get(score.userId);
        entry.totalScore += score.score;
        entry.episodeScores.push({
          episode: score.episode,
          score: score.score,
        });
      }

      // Sort by total score descending
      const sorted = Array.from(standings.values()).sort(
        (a, b) => b.totalScore - a.totalScore
      );

      return sorted;
    }),

  // Recalculate scores for an episode (commissioner only)
  recalculate: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        seasonId: z.string(),
        episodeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await recalculateEpisodeScores(input.seasonId, input.episodeId);
      return { success: true };
    }),
});

