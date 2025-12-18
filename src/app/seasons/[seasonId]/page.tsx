"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import Link from "next/link";

export default function SeasonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  // Get season data - we'll need to pass leagueId, but for now we'll get it from the season
  const { data: season, isLoading } = trpc.season.getById.useQuery(
    { leagueId: "temp", seasonId },
    { enabled: !!seasonId }
  );

  if (isLoading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (!season) {
    return <div className="container mx-auto p-8">Season not found</div>;
  }

  const leagueId = season.leagueId;
  const isCommissioner = true; // TODO: Check from membership

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">{season.name}</h1>
      <p className="text-gray-600 mb-6">
        League: <Link href={`/leagues/${leagueId}`} className="text-blue-600 hover:underline">{season.league.name}</Link>
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-semibold">{season.status}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Roster Size</p>
          <p className="text-lg font-semibold">{season.rosterSize}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Draft</h2>
          <Link
            href={`/seasons/${seasonId}/draft`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Draft Room
          </Link>
        </div>
        {season.drafts[0] && (
          <div className="p-4 border rounded-lg">
            <p>Status: {season.drafts[0].status}</p>
            <p>Current Pick: {season.drafts[0].currentPickNumber}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Castaways</h2>
          {isCommissioner && (
            <div className="flex gap-2">
              <Link
                href={`/seasons/${seasonId}/castaways/add`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Castaway
              </Link>
              <Link
                href={`/seasons/${seasonId}/castaways/upload`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Upload CSV
              </Link>
            </div>
          )}
        </div>
        {season.castaways.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {season.castaways.map((castaway) => (
              <div key={castaway.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{castaway.name}</h3>
                {castaway.tribe && <p className="text-sm text-gray-500">{castaway.tribe}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p>No castaways yet. Add some to get started!</p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Episodes</h2>
          {isCommissioner && (
            <Link
              href={`/seasons/${seasonId}/episodes/create`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Episode
            </Link>
          )}
        </div>
        {season.episodes.length > 0 ? (
          <div className="space-y-2">
            {season.episodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/episodes/${episode.id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-semibold">
                  Episode {episode.episodeNumber}: {episode.name || "Untitled"}
                </h3>
                <p className="text-sm text-gray-500">
                  Air Date: {new Date(episode.airDateTime).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p>No episodes yet.</p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Standings</h2>
        <Link
          href={`/seasons/${seasonId}/standings`}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          View Standings
        </Link>
      </div>
    </div>
  );
}

