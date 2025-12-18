import { z } from "zod";
import { router, protectedProcedure, leagueMemberProcedure, commissionerProcedure } from "../trpc";
import { nanoid } from "nanoid";
import { requireAuth } from "../auth";

export const leagueRouter = router({
  // Create league
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      
      const inviteCode = nanoid(8).toUpperCase();

      const league = await ctx.db.league.create({
        data: {
          name: input.name,
          description: input.description,
          inviteCode,
          memberships: {
            create: {
              userId: user.id,
              role: "COMMISSIONER",
            },
          },
        },
        include: {
          memberships: {
            include: {
              user: true,
            },
          },
        },
      });

      return league;
    }),

  // Join league by invite code
  join: protectedProcedure
    .input(
      z.object({
        inviteCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      const league = await ctx.db.league.findUnique({
        where: { inviteCode: input.inviteCode },
      });

      if (!league) {
        throw new Error("Invalid invite code");
      }

      // Check if already a member
      const existing = await ctx.db.leagueMembership.findUnique({
        where: {
          leagueId_userId: {
            leagueId: league.id,
            userId: user.id,
          },
        },
      });

      if (existing) {
        return { league, membership: existing };
      }

      const membership = await ctx.db.leagueMembership.create({
        data: {
          leagueId: league.id,
          userId: user.id,
          role: "MEMBER",
        },
        include: {
          league: true,
          user: true,
        },
      });

      return { league: membership.league, membership };
    }),

  // List user's leagues
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;

    const memberships = await ctx.db.leagueMembership.findMany({
      where: { userId: user.id },
      include: {
        league: {
          include: {
            seasons: {
              orderBy: { createdAt: "desc" },
            },
            memberships: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return memberships.map((m) => ({
      league: m.league,
      role: m.role,
    }));
  }),

  // Get league by ID
  getById: leagueMemberProcedure
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const league = await ctx.db.league.findUnique({
        where: { id: input.leagueId },
        include: {
          memberships: {
            include: {
              user: true,
            },
          },
          seasons: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return league;
    }),
});

