"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/trpc/client";

export default function UploadCastawaysPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<any[]>([]);

  // We need leagueId - for now we'll get it from season
  const { data: season } = trpc.season.getById.useQuery(
    { leagueId: "temp", seasonId },
    { enabled: !!seasonId }
  );

  const bulkCreate = trpc.castaway.bulkCreate.useMutation({
    onSuccess: () => {
      router.push(`/seasons/${seasonId}`);
    },
  });

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
    const data = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header.toLowerCase()] = values[i] || "";
      });
      return obj;
    });
    return data;
  };

  const handlePreview = () => {
    try {
      const parsed = parseCSV(csvText);
      const formatted = parsed.map((row: any) => ({
        name: row.name || "",
        tribe: row.tribe || "",
        imageurl: row.imageurl || row["image url"] || "",
      }));
      setPreview(formatted);
    } catch (error) {
      alert("Error parsing CSV: " + (error as Error).message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!season || preview.length === 0) return;
    
    const castaways = preview.map((p) => ({
      name: p.name,
      tribe: p.tribe || undefined,
      imageUrl: p.imageurl || undefined,
    }));

    bulkCreate.mutate({
      leagueId: season.leagueId,
      seasonId,
      castaways,
    });
  };

  if (!season) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Upload Castaways (CSV)</h1>
      <p className="mb-4 text-gray-600">
        CSV format: name, tribe, imageUrl (header row required)
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="csv" className="block text-sm font-medium mb-2">
            CSV Data
          </label>
          <textarea
            id="csv"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
            placeholder="name,tribe,imageUrl&#10;Alice,Tribe A,https://example.com/alice.jpg&#10;Bob,Tribe B,https://example.com/bob.jpg"
          />
        </div>
        <button
          type="button"
          onClick={handlePreview}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Preview
        </button>
        {preview.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Preview ({preview.length} castaways)</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Tribe</th>
                    <th className="px-4 py-2 text-left">Image URL</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2">{p.tribe || "-"}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-xs">
                        {p.imageurl || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="submit"
              disabled={bulkCreate.isPending}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkCreate.isPending ? "Uploading..." : "Upload Castaways"}
            </button>
          </div>
        )}
      </form>
      {bulkCreate.error && (
        <p className="mt-4 text-red-600">{bulkCreate.error.message}</p>
      )}
    </div>
  );
}

