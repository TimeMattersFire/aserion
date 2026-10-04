"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type FireBoundary = {
  id: string;
  compartment_id: string;
  boundary_code: string;
  boundary_name: string;
  boundary_type: string | null;
  supporting_construction: string | null;
  required_integrity_minutes: number | null;
  required_insulation_minutes: number | null;
  description: string | null;
  status: string | null;
};

type Penetration = {
  id: string;
  penetration_code: string;
  description: string | null;
  physical_location: string | null;
  status: string | null;
};

export default function BoundaryDetailPage() {
  const params = useParams();
  const router = useRouter();

  const boundaryId = params.id as string;

  const [boundary, setBoundary] = useState<FireBoundary | null>(null);
  const [penetrations, setPenetrations] = useState<Penetration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBoundary() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: boundaryData, error: boundaryError } =
        await supabase
          .from("fire_boundaries")
          .select(
            "id, compartment_id, boundary_code, boundary_name, boundary_type, supporting_construction, required_integrity_minutes, required_insulation_minutes, description, status"
          )
          .eq("id", boundaryId)
          .single();

      if (boundaryError) {
        setError(boundaryError.message);
        setLoading(false);
        return;
      }

      const { data: penetrationData, error: penetrationError } =
        await supabase
          .from("penetrations")
          .select(
            "id, penetration_code, description, physical_location, status"
          )
          .eq("boundary_id", boundaryId)
          .order("penetration_code");

      if (penetrationError) {
        setError(penetrationError.message);
        setLoading(false);
        return;
      }

      setBoundary(boundaryData);
      setPenetrations(penetrationData ?? []);
      setLoading(false);
    }

    loadBoundary();
  }, [router, boundaryId]);

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {loading && (
          <p className="text-sm text-neutral-400">
            Loading boundary...
          </p>
        )}

        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/20 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load boundary
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && boundary && (
          <>
            <button
              type="button"
              onClick={() =>
                router.push(`/compartment/${boundary.compartment_id}`)
              }
              className="text-sm text-neutral-500 transition hover:text-white"
            >
              ← Compartment
            </button>

            <header className="mt-8">
              <p className="text-xs font-semibold tracking-[0.25em] text-red-500">
                ASERION / BOUNDARY
              </p>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-semibold">
                    {boundary.boundary_name}
                  </h1>

                  <p className="mt-2 text-neutral-500">
                    {boundary.boundary_type ||
                      "No boundary type recorded"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="rounded border border-neutral-700 px-3 py-1 font-mono text-xs text-neutral-400">
                    {boundary.boundary_code}
                  </span>

                  <p className="mt-3 text-xs font-semibold tracking-wider text-neutral-500">
                    {boundary.status || "NO STATUS"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Required Performance
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {boundary.required_integrity_minutes !== null
                      ? `${boundary.required_integrity_minutes} min`
                      : "—"}
                    {" / "}
                    {boundary.required_insulation_minutes !== null
                      ? `${boundary.required_insulation_minutes} min`
                      : "—"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-600">
                    Integrity / Insulation
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Supporting Construction
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {boundary.supporting_construction ||
                      "Not recorded"}
                  </p>
                </div>
              </div>

              {boundary.description && (
                <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-500">
                    {boundary.description}
                  </p>
                </div>
              )}
            </header>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Penetrations
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Penetrations linked to this fire-resisting boundary.
                  </p>
                </div>

                <span className="text-sm text-neutral-500">
                  {penetrations.length}{" "}
                  {penetrations.length === 1
                    ? "penetration"
                    : "penetrations"}
                </span>
              </div>

              {penetrations.length === 0 ? (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    No penetrations recorded for this boundary.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {penetrations.map((penetration) => (
                    <article
                      key={penetration.id}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                          <span className="rounded border border-neutral-700 px-2 py-1 font-mono text-xs text-neutral-400">
                            {penetration.penetration_code}
                          </span>

                          <p className="mt-3 text-sm text-neutral-400">
                            {penetration.description ||
                              "No description recorded"}
                          </p>

                          <p className="mt-2 text-sm text-neutral-500">
                            {penetration.physical_location ||
                              "No physical location recorded"}
                          </p>
                        </div>

                        <p className="text-xs font-semibold tracking-wider text-neutral-500">
                          {penetration.status || "NO STATUS"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}