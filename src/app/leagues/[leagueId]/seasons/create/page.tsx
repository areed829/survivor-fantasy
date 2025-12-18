"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/trpc/client";

export default function CreateSeasonPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as string;

  const [name, setName] = useState("");
  const [rosterSize, setRosterSize] = useState(6);
  const [draftType, setDraftType] = useState<"SNAKE" | "LINEAR">("SNAKE");
  const [pickTimerSeconds, setPickTimerSeconds] = useState(90);
  const [captainEnabled, setCaptainEnabled] = useState(false);
  const [spoilerLockEnabled, setSpoilerLockEnabled] = useState(true);

  const createSeason = trpc.season.create.useMutation({
    onSuccess: (data) => {
      router.push(`/seasons/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSeason.mutate({
      leagueId,
      name,
      rosterSize,
      draftType,
      pickTimerSeconds,
      captainEnabled,
      spoilerLockEnabled,
    });
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Season</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Season Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="rosterSize" className="block text-sm font-medium mb-2">
            Roster Size *
          </label>
          <input
            id="rosterSize"
            type="number"
            min="1"
            value={rosterSize}
            onChange={(e) => setRosterSize(parseInt(e.target.value))}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="draftType" className="block text-sm font-medium mb-2">
            Draft Type *
          </label>
          <select
            id="draftType"
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as "SNAKE" | "LINEAR")}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="SNAKE">Snake Draft</option>
            <option value="LINEAR">Linear Draft</option>
          </select>
        </div>
        <div>
          <label htmlFor="pickTimerSeconds" className="block text-sm font-medium mb-2">
            Pick Timer (seconds, 0 = untimed) *
          </label>
          <input
            id="pickTimerSeconds"
            type="number"
            min="0"
            value={pickTimerSeconds}
            onChange={(e) => setPickTimerSeconds(parseInt(e.target.value))}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="captainEnabled"
            type="checkbox"
            checked={captainEnabled}
            onChange={(e) => setCaptainEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="captainEnabled" className="text-sm font-medium">
            Enable Captain Mechanics
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="spoilerLockEnabled"
            type="checkbox"
            checked={spoilerLockEnabled}
            onChange={(e) => setSpoilerLockEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="spoilerLockEnabled" className="text-sm font-medium">
            Enable Spoiler Lock
          </label>
        </div>
        <button
          type="submit"
          disabled={createSeason.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {createSeason.isPending ? "Creating..." : "Create Season"}
        </button>
      </form>
      {createSeason.error && (
        <p className="mt-4 text-red-600">{createSeason.error.message}</p>
      )}
    </div>
  );
}

