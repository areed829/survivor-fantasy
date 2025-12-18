import { z } from "zod";
import { router, commissionerProcedure, leagueMemberProcedure } from "../trpc";

export const castawayRouter = router({
  // Create castaway (commissioner only)
  create: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        seasonId: z.string(),
        name: z.string().min(1),
        tribe: z.string().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, seasonId, ...castawayData } = input;

      const castaway = await ctx.db.castaway.create({
        data: {
          seasonId,
          ...castawayData,
        },
        include: {
          season: true,
        },
      });

      return castaway;
    }),

  // Bulk create castaways from CSV (commissioner only)
  bulkCreate: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        seasonId: z.string(),
        castaways: z.array(
          z.object({
            name: z.string().min(1),
            tribe: z.string().optional(),
            imageUrl: z.string().url().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, seasonId, castaways } = input;

      const created = await ctx.db.castaway.createMany({
        data: castaways.map((c) => ({
          seasonId,
          ...c,
        })),
      });

      return { count: created.count };
    }),

  // Get castaway by ID
  getById: leagueMemberProcedure
    .input(z.object({ leagueId: z.string(), castawayId: z.string() }))
    .query(async ({ ctx, input }) => {
      const castaway = await ctx.db.castaway.findUnique({
        where: { id: input.castawayId },
        include: {
          season: true,
          rosterEntries: {
            include: {
              user: true,
            },
          },
        },
      });

      return castaway;
    }),

  // List castaways in season
  list: leagueMemberProcedure
    .input(z.object({ leagueId: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const castaways = await ctx.db.castaway.findMany({
        where: { seasonId: input.seasonId },
        include: {
          rosterEntries: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return castaways;
    }),

  // Update castaway (commissioner only)
  update: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        castawayId: z.string(),
        name: z.string().min(1).optional(),
        tribe: z.string().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, castawayId, ...updateData } = input;

      const castaway = await ctx.db.castaway.update({
        where: { id: castawayId },
        data: updateData,
        include: {
          season: true,
        },
      });

      return castaway;
    }),

  // Delete castaway (commissioner only)
  delete: commissionerProcedure
    .input(z.object({ leagueId: z.string(), castawayId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.castaway.delete({
        where: { id: input.castawayId },
      });

      return { success: true };
    }),
});

