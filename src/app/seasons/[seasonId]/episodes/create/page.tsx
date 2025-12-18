"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/trpc/client";

export default function CreateEpisodePage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [name, setName] = useState("");
  const [airDateTime, setAirDateTime] = useState("");
  const [lockOverride, setLockOverride] = useState(false);

  // We need leagueId - for now we'll get it from season
  const { data: season } = trpc.season.getById.useQuery(
    { leagueId: "temp", seasonId },
    { enabled: !!seasonId }
  );

  const createEpisode = trpc.episode.create.useMutation({
    onSuccess: () => {
      router.push(`/seasons/${seasonId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!season) return;
    createEpisode.mutate({
      leagueId: season.leagueId,
      seasonId,
      episodeNumber,
      name: name || undefined,
      airDateTime: new Date(airDateTime),
      lockOverride,
    });
  };

  if (!season) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Episode</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="episodeNumber" className="block text-sm font-medium mb-2">
            Episode Number *
          </label>
          <input
            id="episodeNumber"
            type="number"
            min="1"
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(parseInt(e.target.value))}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Episode Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="airDateTime" className="block text-sm font-medium mb-2">
            Air Date & Time *
          </label>
          <input
            id="airDateTime"
            type="datetime-local"
            value={airDateTime}
            onChange={(e) => setAirDateTime(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="lockOverride"
            type="checkbox"
            checked={lockOverride}
            onChange={(e) => setLockOverride(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="lockOverride" className="text-sm font-medium">
            Override Spoiler Lock (allow outcomes before air date)
          </label>
        </div>
        <button
          type="submit"
          disabled={createEpisode.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {createEpisode.isPending ? "Creating..." : "Create Episode"}
        </button>
      </form>
      {createEpisode.error && (
        <p className="mt-4 text-red-600">{createEpisode.error.message}</p>
      )}
    </div>
  );
}

