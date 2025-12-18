"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import Link from "next/link";

export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as string;

  const { data: league, isLoading } = trpc.league.getById.useQuery(
    { leagueId },
    { enabled: !!leagueId }
  );

  if (isLoading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (!league) {
    return <div className="container mx-auto p-8">League not found</div>;
  }

  const isCommissioner = league.memberships.some(
    (m) => m.role === "COMMISSIONER"
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">{league.name}</h1>
      {league.description && (
        <p className="text-gray-600 mb-6">{league.description}</p>
      )}

      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Invite Code: <span className="font-mono font-bold">{league.inviteCode}</span>
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Members</h2>
        <ul className="space-y-2">
          {league.memberships.map((membership) => (
            <li key={membership.id} className="flex items-center gap-2">
              <span>{membership.user.name || membership.user.email}</span>
              <span className="text-sm text-gray-500">
                ({membership.role})
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Seasons</h2>
          {isCommissioner && (
            <Link
              href={`/leagues/${leagueId}/seasons/create`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Season
            </Link>
          )}
        </div>
        {league.seasons.length > 0 ? (
          <div className="grid gap-4">
            {league.seasons.map((season) => (
              <Link
                key={season.id}
                href={`/seasons/${season.id}`}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <h3 className="text-xl font-semibold">{season.name}</h3>
                <p className="text-sm text-gray-500">
                  Status: {season.status} • Roster Size: {season.rosterSize}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p>No seasons yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

