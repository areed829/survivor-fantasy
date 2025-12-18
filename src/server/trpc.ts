import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "./db";
import { requireAuth, requireLeagueMember, requireCommissioner } from "./auth";

/**
 * Context for tRPC
 */
export async function createTRPCContext() {
  return {
    db,
  };
}

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const user = await requireAuth();
  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

/**
 * League member procedure - requires league membership
 */
export const leagueMemberProcedure = protectedProcedure.use(
  async ({ ctx, input, next }) => {
    // Input should have leagueId
    const leagueId = (input as { leagueId: string })?.leagueId;
    if (!leagueId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "leagueId is required",
      });
    }

    const { membership } = await requireLeagueMember(leagueId);
    return next({
      ctx: {
        ...ctx,
        membership,
      },
    });
  }
);

/**
 * Commissioner procedure - requires commissioner role
 */
export const commissionerProcedure = protectedProcedure.use(
  async ({ ctx, input, next }) => {
    const leagueId = (input as { leagueId: string })?.leagueId;
    if (!leagueId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "leagueId is required",
      });
    }

    const { membership } = await requireCommissioner(leagueId);
    return next({
      ctx: {
        ...ctx,
        membership,
      },
    });
  }
);

