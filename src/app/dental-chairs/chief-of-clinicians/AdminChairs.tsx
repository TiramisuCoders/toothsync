"use client";

import React, { useEffect, useMemo, useState } from "react";

type ChairStatus = "Available" | "Occupied" | "Under Maintenance" | null;

type Chair = {
  id: string;
  status: ChairStatus;
  procedures: string[];
  student: string | null;
};

export default function AdminChairs() {
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dental-chairs", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || body?.message || "Failed to fetch chairs");
        }
        const data: Chair[] = await res.json();
        setChairs(data);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to load chairs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Helper: UI badge
  const StatusBadge: React.FC<{ status: ChairStatus }> = ({ status }) => {
    if (status === "Occupied") {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Occupied</span>;
    }
    if (status === "Available") {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Available</span>;
    }
    if (status === "Under Maintenance") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Under Maintenance
        </span>
      );
    }
    // status === null or unknown
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">—</span>;
  };

  // Optimistic update with rollback
  async function setChairStatus(chairId: string, status: Exclude<ChairStatus, null>) {
    setError(null);

    // Optimistically update UI
    const prev = chairs;
    const next = prev.map((c) => (c.id === chairId ? { ...c, status } : c));
    setChairs(next);
    setUpdating((m) => ({ ...m, [chairId]: true }));

    try {
      const res = await fetch("/api/dental-chairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chairId, status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || "Failed to update chair");
      }

      // Optionally re-fetch to ensure we reflect DB truth
      const refetch = await fetch("/api/dental-chairs", { cache: "no-store" });
      if (refetch.ok) {
        const rows: Chair[] = await refetch.json();
        setChairs(rows);
      } else {
        // If refetch fails, keep optimistic state but surface a warning
        console.warn("Refetch after update failed");
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to update chair");
      // Rollback
      setChairs(prev);
    } finally {
      setUpdating((m) => {
        const { [chairId]: _, ...rest } = m;
        return rest;
      });
    }
  }

  const anyUpdating = useMemo(() => Object.keys(updating).length > 0, [updating]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dental Chairs</h1>
        {loading && <span className="text-sm text-gray-500">Loading…</span>}
        {!loading && anyUpdating && <span className="text-sm text-gray-500">Saving…</span>}
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <th className="px-4 py-3">Chair</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Procedures</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {chairs.map((c) => {
              const isSaving = !!updating[c.id];
              return (
                <tr key={c.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.id}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {c.procedures?.length ? c.procedures.join(", ") : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {c.student ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border px-3 py-1.5 text-sm transition hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => setChairStatus(c.id, "Available")}
                        disabled={isSaving}
                        title="Set Available"
                      >
                        {isSaving ? "…" : "Available"}
                      </button>
                      <button
                        className="rounded-lg border px-3 py-1.5 text-sm transition hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => setChairStatus(c.id, "Occupied")}
                        disabled={isSaving}
                        title="Set Occupied"
                      >
                        {isSaving ? "…" : "Occupied"}
                      </button>
                      <button
                        className="rounded-lg border px-3 py-1.5 text-sm transition hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => setChairStatus(c.id, "Under Maintenance")}
                        disabled={isSaving}
                        title="Set Under Maintenance"
                      >
                        {isSaving ? "…" : "Under Maintenance"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && chairs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No chairs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500">
        Tip: If a status shows as a dash (—), it means the combination didn’t match any rule and the server returned
        <code className="mx-1 rounded bg-gray-100 px-1">null</code>.
      </div>
    </div>
  );
}
