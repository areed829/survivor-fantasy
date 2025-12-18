"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";

export default function DraftRoomPage() {
  const params = useParams();
  const seasonId = params.seasonId as string;
  const { user } = useUser();

  // Get draft data - we'll need leagueId, but we can get it from the season
  const { data: draftData, isLoading, refetch } = trpc.draft.getBySeason.useQuery(
    { leagueId: "temp", seasonId },
    { enabled: !!seasonId, refetchInterval: 5000 } // Poll every 5 seconds
  );

  const makePick = trpc.draft.makePick.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [selectedCastaway, setSelectedCastaway] = useState<string | null>(null);

  if (isLoading || !draftData) {
    return <div className="container mx-auto p-8">Loading draft...</div>;
  }

  const { season, isMyTurn, currentUserId, ...draft } = draftData;
  const leagueId = season.leagueId;
  const availableCastaways = season.castaways.filter(
    (c) => !draft.picks.some((p) => p.castawayId === c.id)
  );

  const handlePick = () => {
    if (!selectedCastaway || !isMyTurn) return;
    makePick.mutate({
      leagueId,
      draftId: draft.id,
      castawayId: selectedCastaway,
    });
    setSelectedCastaway(null);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Draft Room</h1>
      <div className="mb-6">
        <p className="text-lg">
          Status: <span className="font-semibold">{draft.status}</span>
        </p>
        <p className="text-lg">
          Current Pick: <span className="font-semibold">{draft.currentPickNumber}</span>
        </p>
        {draft.currentPicker && (
          <p className="text-lg">
            Current Picker: <span className="font-semibold">{draft.currentPicker}</span>
          </p>
        )}
        {isMyTurn && (
          <p className="text-green-600 font-semibold mt-2">It's your turn!</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Draft Board</h2>
          <div className="space-y-2">
            {draft.picks.map((pick) => (
              <div key={pick.id} className="p-3 border rounded-lg">
                <span className="font-mono text-sm text-gray-500">
                  #{pick.pickNumber}
                </span>{" "}
                <span className="font-semibold">{pick.user.name || pick.user.email}</span>{" "}
                selected <span className="font-semibold">{pick.castaway.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Castaways</h2>
          {isMyTurn ? (
            <div className="space-y-2">
              {availableCastaways.map((castaway) => (
                <button
                  key={castaway.id}
                  onClick={() => setSelectedCastaway(castaway.id)}
                  className={`w-full p-3 border rounded-lg text-left hover:bg-gray-50 ${
                    selectedCastaway === castaway.id ? "bg-blue-100 border-blue-500" : ""
                  }`}
                >
                  {castaway.name}
                  {castaway.tribe && (
                    <span className="text-sm text-gray-500 ml-2">({castaway.tribe})</span>
                  )}
                </button>
              ))}
              {selectedCastaway && (
                <button
                  onClick={handlePick}
                  disabled={makePick.isPending}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {makePick.isPending ? "Picking..." : "Make Pick"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {availableCastaways.map((castaway) => (
                <div
                  key={castaway.id}
                  className="p-3 border rounded-lg"
                >
                  {castaway.name}
                  {castaway.tribe && (
                    <span className="text-sm text-gray-500 ml-2">({castaway.tribe})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

