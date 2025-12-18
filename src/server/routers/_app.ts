import { router } from "../trpc";
import { leagueRouter } from "./league";
import { seasonRouter } from "./season";
import { episodeRouter } from "./episode";
import { castawayRouter } from "./castaway";
import { draftRouter } from "./draft";
import { scoringRouter } from "./scoring";

export const appRouter = router({
  league: leagueRouter,
  season: seasonRouter,
  episode: episodeRouter,
  castaway: castawayRouter,
  draft: draftRouter,
  scoring: scoringRouter,
});

export type AppRouter = typeof appRouter;

