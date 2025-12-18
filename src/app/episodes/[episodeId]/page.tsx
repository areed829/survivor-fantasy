"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/trpc/client";

export default function EpisodeDetailPage() {
  const params = useParams();
  const episodeId = params.episodeId as string;

  const [selectedCastaway, setSelectedCastaway] = useState("");
  const [outcomeType, setOutcomeType] = useState("");
  const [notes, setNotes] = useState("");

  // We need leagueId - get it from episode
  const { data: episode, isLoading, refetch } = trpc.episode.getById.useQuery(
    { leagueId: "temp", episodeId },
    { enabled: !!episodeId }
  );

  const { data: castaways } = trpc.castaway.list.useQuery(
    { leagueId: episode?.season.leagueId || "temp", seasonId: episode?.seasonId || "" },
    { enabled: !!episode }
  );

  const createOutcome = trpc.scoring.createOutcome.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedCastaway("");
      setOutcomeType("");
      setNotes("");
    },
  });

  const deleteOutcome = trpc.scoring.deleteOutcome.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!episode) return;
    createOutcome.mutate({
      leagueId: episode.season.leagueId,
      seasonId: episode.seasonId,
      episodeId: episode.id,
      castawayId: selectedCastaway,
      outcomeType: outcomeType as any,
      notes: notes || undefined,
    });
  };

  if (isLoading || !episode) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  const isCommissioner = true; // TODO: Check from membership

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">
        Episode {episode.episodeNumber}: {episode.name || "Untitled"}
      </h1>
      <p className="text-gray-600 mb-6">
        Air Date: {new Date(episode.airDateTime).toLocaleString()}
      </p>

      {isCommissioner && (
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Enter Outcome</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="castaway" className="block text-sm font-medium mb-2">
                Castaway *
              </label>
              <select
                id="castaway"
                value={selectedCastaway}
                onChange={(e) => setSelectedCastaway(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select castaway</option>
                {castaways?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="outcomeType" className="block text-sm font-medium mb-2">
                Outcome Type *
              </label>
              <select
                id="outcomeType"
                value={outcomeType}
                onChange={(e) => setOutcomeType(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select outcome</option>
                <option value="IMMUNITY_WIN">Immunity Win (+2)</option>
                <option value="REWARD_WIN">Reward Win (+1)</option>
                <option value="IDOL_FOUND">Idol/Advantage Found (+2)</option>
                <option value="IDOL_PLAYED">Idol Played Successfully (+3)</option>
                <option value="VOTED_OUT">Voted Out (-2)</option>
                <option value="FINAL_TRIBAL">Final Tribal (+5)</option>
                <option value="WINNER">Winner (+10)</option>
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={createOutcome.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createOutcome.isPending ? "Adding..." : "Add Outcome"}
            </button>
          </form>
          {createOutcome.error && (
            <p className="mt-4 text-red-600">{createOutcome.error.message}</p>
          )}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Outcomes</h2>
        {episode.episodeOutcomes.length > 0 ? (
          <div className="space-y-2">
            {episode.episodeOutcomes.map((outcome: any) => (
              <div key={outcome.id} className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold">{outcome.castaway.name}</span>
                  <span className="ml-2 text-gray-600">{outcome.outcomeType}</span>
                  {outcome.notes && (
                    <p className="text-sm text-gray-500 mt-1">{outcome.notes}</p>
                  )}
                </div>
                {isCommissioner && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this outcome?")) {
                        deleteOutcome.mutate({
                          leagueId: episode.season.leagueId,
                          outcomeId: outcome.id,
                        });
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No outcomes entered yet.</p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Episode Scores</h2>
        {episode.episodeScores.length > 0 ? (
          <div className="space-y-2">
            {episode.episodeScores
              .sort((a: any, b: any) => b.score - a.score)
              .map((score: any) => (
                <div key={score.id} className="p-4 border rounded-lg">
                  <span className="font-semibold">
                    {score.user.name || score.user.email}
                  </span>
                  <span className="ml-2 text-lg">
                    {score.score > 0 ? "+" : ""}
                    {score.score}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p>No scores yet. Enter outcomes to calculate scores.</p>
        )}
      </div>
    </div>
  );
}

