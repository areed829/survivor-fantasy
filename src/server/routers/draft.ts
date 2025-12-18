import { z } from "zod";
import { router, leagueMemberProcedure } from "../trpc";
import {
  getOrCreateDraft,
  getCurrentPicker,
  makeDraftPick,
} from "../services/draftService";

export const draftRouter = router({
  // Get draft for season
  getBySeason: leagueMemberProcedure
    .input(z.object({ leagueId: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const draft = await getOrCreateDraft(input.seasonId);

      const season = await ctx.db.season.findUnique({
        where: { id: input.seasonId },
        include: {
          league: {
            include: {
              memberships: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!season) {
        throw new Error("Season not found");
      }

      const userIds = season.league.memberships.map((m) => m.userId);
      const currentPicker = getCurrentPicker(draft as any, userIds);
      const isMyTurn = currentPicker === ctx.user.id;

      return {
        ...draft,
        currentPicker,
        isMyTurn,
        season,
        currentUserId: ctx.user.id,
      };
    }),

  // Make a draft pick
  makePick: leagueMemberProcedure
    .input(
      z.object({
        leagueId: z.string(),
        draftId: z.string(),
        castawayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await makeDraftPick(
        input.draftId,
        ctx.user.id,
        input.castawayId
      );

      return result;
    }),

  // Get user's roster for a season
  getRoster: leagueMemberProcedure
    .input(z.object({ leagueId: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rosterEntries = await ctx.db.rosterEntry.findMany({
        where: {
          userId: ctx.user.id,
          seasonId: input.seasonId,
        },
        include: {
          castaway: true,
          season: true,
        },
        orderBy: { createdAt: "asc" },
      });

      return rosterEntries;
    }),

  // Get all rosters for a season (for standings)
  getAllRosters: leagueMemberProcedure
    .input(z.object({ leagueId: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rosterEntries = await ctx.db.rosterEntry.findMany({
        where: {
          seasonId: input.seasonId,
        },
        include: {
          user: true,
          castaway: true,
        },
        orderBy: [
          { userId: "asc" },
          { createdAt: "asc" },
        ],
      });

      // Group by user
      const rostersByUser = new Map();
      for (const entry of rosterEntries) {
        if (!rostersByUser.has(entry.userId)) {
          rostersByUser.set(entry.userId, {
            user: entry.user,
            castaways: [],
          });
        }
        rostersByUser.get(entry.userId).castaways.push(entry.castaway);
      }

      return Array.from(rostersByUser.values());
    }),
});

