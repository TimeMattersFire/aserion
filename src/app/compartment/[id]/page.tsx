"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type FireCompartment = {
  id: string;
  level_id: string;
  compartment_code: string;
  compartment_name: string;
  compartment_type: string | null;
  description: string | null;
  required_fire_resistance_minutes: number | null;
  status: string | null;
};

type FireBoundary = {
  id: string;
  boundary_code: string;
  boundary_name: string;
  boundary_type: string | null;
  supporting_construction: string | null;
  required_integrity_minutes: number | null;
  required_insulation_minutes: number | null;
  description: string | null;
  status: string | null;
};

export default function CompartmentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const compartmentId = params.id as string;

  const [compartment, setCompartment] =
    useState<FireCompartment | null>(null);

  const [boundaries, setBoundaries] = useState<FireBoundary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCompartment() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const {
        data: compartmentData,
        error: compartmentError,
      } = await supabase
        .from("fire_compartments")
        .select(
          "id, level_id, compartment_code, compartment_name, compartment_type, description, required_fire_resistance_minutes, status"
        )
        .eq("id", compartmentId)
        .single();

      if (compartmentError) {
        setError(compartmentError.message);
        setLoading(false);
        return;
      }

      const { data: boundaryData, error: boundaryError } =
        await supabase
          .from("fire_boundaries")
          .select(
            "id, boundary_code, boundary_name, boundary_type, supporting_construction, required_integrity_minutes, required_insulation_minutes, description, status"
          )
          .eq("compartment_id", compartmentId)
          .order("boundary_code");

      if (boundaryError) {
        setError(boundaryError.message);
        setLoading(false);
        return;
      }

      setCompartment(compartmentData);
      setBoundaries(boundaryData ?? []);
      setLoading(false);
    }

    loadCompartment();
  }, [router, compartmentId]);

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {loading && (
          <p className="text-sm text-neutral-400">
            Loading compartment...
          </p>
        )}

        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/20 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load compartment
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && compartment && (
          <>
            <button
              type="button"
              onClick={() =>
                router.push(`/level/${compartment.level_id}`)
              }
              className="text-sm text-neutral-500 transition hover:text-white"
            >
              ← Level
            </button>

            <header className="mt-8">
              <p className="text-xs font-semibold tracking-[0.25em] text-red-500">
                ASERION / COMPARTMENT
              </p>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-semibold">
                    {compartment.compartment_name}
                  </h1>

                  <p className="mt-2 text-neutral-500">
                    {compartment.compartment_type ||
                      "No compartment type recorded"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="rounded border border-neutral-700 px-3 py-1 font-mono text-xs text-neutral-400">
                    {compartment.compartment_code}
                  </span>

                  <p className="mt-3 text-xs font-semibold tracking-wider text-neutral-500">
                    {compartment.status || "NO STATUS"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                <p className="text-xs uppercase tracking-wider text-neutral-600">
                  Required Fire Resistance
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {compartment.required_fire_resistance_minutes !==
                  null
                    ? `${compartment.required_fire_resistance_minutes} min`
                    : "Not recorded"}
                </p>

                {compartment.description && (
                  <p className="mt-3 text-sm text-neutral-500">
                    {compartment.description}
                  </p>
                )}
              </div>
            </header>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Fire Boundaries
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Fire-resisting boundaries linked to this compartment.
                  </p>
                </div>

                <span className="text-sm text-neutral-500">
                  {boundaries.length}{" "}
                  {boundaries.length === 1
                    ? "boundary"
                    : "boundaries"}
                </span>
              </div>

              {boundaries.length === 0 ? (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    No fire boundaries recorded for this compartment.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {boundaries.map((boundary) => (
                    <button
                      key={boundary.id}
                      type="button"
                      onClick={() =>
                        router.push(`/boundary/${boundary.id}`)
                      }
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-5 text-left transition hover:border-neutral-600"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded border border-neutral-700 px-2 py-1 font-mono text-xs text-neutral-400">
                              {boundary.boundary_code}
                            </span>

                            <h3 className="text-lg font-semibold">
                              {boundary.boundary_name}
                            </h3>
                          </div>

                          <p className="mt-3 text-sm text-neutral-500">
                            {boundary.boundary_type ||
                              "No boundary type recorded"}
                          </p>

                          <p className="mt-1 text-sm text-neutral-500">
                            {boundary.supporting_construction ||
                              "No supporting construction recorded"}
                          </p>

                          {boundary.description && (
                            <p className="mt-2 text-sm text-neutral-500">
                              {boundary.description}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-neutral-600">
                            Required Performance
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {boundary.required_integrity_minutes !==
                            null
                              ? `${boundary.required_integrity_minutes} min`
                              : "—"}
                            {" / "}
                            {boundary.required_insulation_minutes !==
                            null
                              ? `${boundary.required_insulation_minutes} min`
                              : "—"}
                          </p>

                          <p className="mt-1 text-xs text-neutral-600">
                            Integrity / Insulation
                          </p>

                          <p className="mt-3 text-xs font-semibold tracking-wider text-neutral-500">
                            {boundary.status || "NO STATUS"}
                          </p>
                        </div>
                      </div>
                    </button>
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