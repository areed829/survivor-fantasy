"use client";

import { useUser } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: leagues, isLoading } = trpc.league.list.useQuery();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="mb-6">Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!</p>

      <div className="mb-6">
        <Link
          href="/leagues/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create League
        </Link>
        <Link
          href="/leagues/join"
          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Join League
        </Link>
      </div>

      {isLoading ? (
        <p>Loading leagues...</p>
      ) : leagues && leagues.length > 0 ? (
        <div className="grid gap-4">
          <h2 className="text-2xl font-semibold">Your Leagues</h2>
          {leagues.map(({ league, role }) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="p-4 border rounded-lg hover:bg-gray-50"
            >
              <h3 className="text-xl font-semibold">{league.name}</h3>
              <p className="text-gray-600">{league.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Role: {role} • Invite Code: {league.inviteCode}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p>You haven't joined any leagues yet. Create or join one to get started!</p>
      )}
    </div>
  );
}

