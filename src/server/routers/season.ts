import { z } from "zod";
import { router, commissionerProcedure, leagueMemberProcedure } from "../trpc";

export const seasonRouter = router({
  // Create season (commissioner only)
  create: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        name: z.string().min(1),
        rosterSize: z.number().int().positive().default(6),
        draftType: z.enum(["SNAKE", "LINEAR"]).default("SNAKE"),
        pickTimerSeconds: z.number().int().min(0).default(90),
        captainEnabled: z.boolean().default(false),
        spoilerLockEnabled: z.boolean().default(true),
        scoringConfig: z.record(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, ...seasonData } = input;

      const season = await ctx.db.season.create({
        data: {
          leagueId,
          ...seasonData,
        },
        include: {
          league: true,
          episodes: true,
          castaways: true,
        },
      });

      return season;
    }),

  // Get season by ID
  getById: leagueMemberProcedure
    .input(z.object({ leagueId: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const season = await ctx.db.season.findUnique({
        where: { id: input.seasonId },
        include: {
          league: true,
          episodes: {
            orderBy: { episodeNumber: "asc" },
          },
          castaways: {
            orderBy: { name: "asc" },
          },
          drafts: {
            include: {
              picks: {
                include: {
                  user: true,
                  castaway: true,
                },
                orderBy: { pickNumber: "asc" },
              },
            },
          },
        },
      });

      return season;
    }),

  // List seasons in league
  list: leagueMemberProcedure
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const seasons = await ctx.db.season.findMany({
        where: { leagueId: input.leagueId },
        include: {
          episodes: {
            orderBy: { episodeNumber: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return seasons;
    }),

  // Update season (commissioner only)
  update: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        seasonId: z.string(),
        name: z.string().min(1).optional(),
        rosterSize: z.number().int().positive().optional(),
        draftType: z.enum(["SNAKE", "LINEAR"]).optional(),
        pickTimerSeconds: z.number().int().min(0).optional(),
        captainEnabled: z.boolean().optional(),
        spoilerLockEnabled: z.boolean().optional(),
        scoringConfig: z.record(z.number()).optional(),
        status: z.enum(["DRAFT", "IN_PROGRESS", "COMPLETED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, seasonId, ...updateData } = input;

      const season = await ctx.db.season.update({
        where: { id: seasonId },
        data: updateData,
        include: {
          league: true,
        },
      });

      return season;
    }),
});

