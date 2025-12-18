"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/trpc/client";

export default function AddCastawayPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  const [name, setName] = useState("");
  const [tribe, setTribe] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // We need leagueId - for now we'll get it from season
  const { data: season } = trpc.season.getById.useQuery(
    { leagueId: "temp", seasonId },
    { enabled: !!seasonId }
  );

  const createCastaway = trpc.castaway.create.useMutation({
    onSuccess: () => {
      router.push(`/seasons/${seasonId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!season) return;
    createCastaway.mutate({
      leagueId: season.leagueId,
      seasonId,
      name,
      tribe: tribe || undefined,
      imageUrl: imageUrl || undefined,
    });
  };

  if (!season) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Add Castaway</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name *
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
          <label htmlFor="tribe" className="block text-sm font-medium mb-2">
            Tribe
          </label>
          <input
            id="tribe"
            type="text"
            value={tribe}
            onChange={(e) => setTribe(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium mb-2">
            Image URL
          </label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          disabled={createCastaway.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {createCastaway.isPending ? "Adding..." : "Add Castaway"}
        </button>
      </form>
      {createCastaway.error && (
        <p className="mt-4 text-red-600">{createCastaway.error.message}</p>
      )}
    </div>
  );
}

