import { z } from "zod";
import { router, commissionerProcedure, leagueMemberProcedure } from "../trpc";
import { validateEpisodeNotLocked } from "../services/spoilerLockService";

export const episodeRouter = router({
  // Create episode (commissioner only)
  create: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        seasonId: z.string(),
        episodeNumber: z.number().int().positive(),
        name: z.string().optional(),
        airDateTime: z.date(),
        lockOverride: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, seasonId, ...episodeData } = input;

      const episode = await ctx.db.episode.create({
        data: {
          seasonId,
          ...episodeData,
        },
        include: {
          season: true,
        },
      });

      return episode;
    }),

  // Get episode by ID
  getById: leagueMemberProcedure
    .input(z.object({ leagueId: z.string(), episodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const episode = await ctx.db.episode.findUnique({
        where: { id: input.episodeId },
        include: {
          season: true,
          episodeOutcomes: {
            include: {
              castaway: true,
            },
          },
          episodeScores: {
            include: {
              user: true,
            },
            orderBy: { score: "desc" },
          },
        },
      });

      return episode;
    }),

  // List episodes in season
  list: leagueMemberProcedure
    .input(z.object({ leagueId: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const episodes = await ctx.db.episode.findMany({
        where: { seasonId: input.seasonId },
        include: {
          episodeOutcomes: true,
          episodeScores: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { episodeNumber: "asc" },
      });

      return episodes;
    }),

  // Update episode (commissioner only)
  update: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        episodeId: z.string(),
        name: z.string().optional(),
        airDateTime: z.date().optional(),
        lockOverride: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, episodeId, ...updateData } = input;

      const episode = await ctx.db.episode.update({
        where: { id: episodeId },
        data: updateData,
        include: {
          season: true,
        },
      });

      return episode;
    }),
});

