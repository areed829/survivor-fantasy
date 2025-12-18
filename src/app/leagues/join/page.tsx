"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

export default function JoinLeaguePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");

  const joinLeague = trpc.league.join.useMutation({
    onSuccess: (data) => {
      router.push(`/leagues/${data.league.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinLeague.mutate({ inviteCode: inviteCode.toUpperCase() });
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Join League</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium mb-2">
            Invite Code *
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            placeholder="Enter 8-character invite code"
            maxLength={8}
            className="w-full px-4 py-2 border rounded-lg uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={joinLeague.isPending}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {joinLeague.isPending ? "Joining..." : "Join League"}
        </button>
      </form>
      {joinLeague.error && (
        <p className="mt-4 text-red-600">{joinLeague.error.message}</p>
      )}
    </div>
  );
}

