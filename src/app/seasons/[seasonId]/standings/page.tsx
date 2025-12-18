"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";

export default function StandingsPage() {
  const params = useParams();
  const seasonId = params.seasonId as string;

  // We need leagueId - for now we'll get it from season
  const { data: season } = trpc.season.getById.useQuery(
    { leagueId: "temp", seasonId },
    { enabled: !!seasonId }
  );

  const { data: standings, isLoading } = trpc.scoring.getStandings.useQuery(
    { leagueId: season?.leagueId || "temp", seasonId },
    { enabled: !!season && !!seasonId }
  );

  if (isLoading || !season) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Standings - {season.name}</h1>
      {standings && standings.length > 0 ? (
        <div className="space-y-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left border">Rank</th>
                <th className="px-4 py-2 text-left border">User</th>
                <th className="px-4 py-2 text-right border">Total Score</th>
                <th className="px-4 py-2 text-left border">Episode Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, index) => (
                <tr key={entry.user.id} className="border-t">
                  <td className="px-4 py-2 border font-semibold">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-2 border">
                    {entry.user.name || entry.user.email}
                  </td>
                  <td className="px-4 py-2 border text-right font-semibold">
                    {entry.totalScore}
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="flex gap-2 flex-wrap">
                      {entry.episodeScores.map((es: any) => (
                        <span
                          key={es.episode.id}
                          className="text-xs px-2 py-1 bg-gray-100 rounded"
                          title={`Episode ${es.episode.episodeNumber}: ${es.score} points`}
                        >
                          E{es.episode.episodeNumber}: {es.score > 0 ? "+" : ""}
                          {es.score}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No standings data yet. Outcomes need to be entered for episodes.</p>
      )}
    </div>
  );
}

