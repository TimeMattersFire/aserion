"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type BuildingLevel = {
  id: string;
  site_id: string;
  level_code: string;
  level_name: string;
  level_number: number | null;
  description: string | null;
  status: string | null;
};

type FireCompartment = {
  id: string;
  compartment_code: string;
  compartment_name: string;
  compartment_type: string | null;
  description: string | null;
  required_fire_resistance_minutes: number | null;
  status: string | null;
};

export default function LevelDetailPage() {
  const params = useParams();
  const router = useRouter();

  const levelId = params.id as string;

  const [level, setLevel] = useState<BuildingLevel | null>(null);
  const [compartments, setCompartments] = useState<FireCompartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLevel() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: levelData, error: levelError } = await supabase
        .from("building_levels")
        .select(
          "id, site_id, level_code, level_name, level_number, description, status"
        )
        .eq("id", levelId)
        .single();

      if (levelError) {
        setError(levelError.message);
        setLoading(false);
        return;
      }

      const { data: compartmentData, error: compartmentError } =
        await supabase
          .from("fire_compartments")
          .select(
            "id, compartment_code, compartment_name, compartment_type, description, required_fire_resistance_minutes, status"
          )
          .eq("level_id", levelId)
          .order("compartment_code");

      if (compartmentError) {
        setError(compartmentError.message);
        setLoading(false);
        return;
      }

      setLevel(levelData);
      setCompartments(compartmentData ?? []);
      setLoading(false);
    }

    loadLevel();
  }, [router, levelId]);

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {loading && (
          <p className="text-sm text-neutral-400">
            Loading level...
          </p>
        )}

        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/20 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load level
            </p>

            <p className="mt-2 text-sm text-neutral-400">{error}</p>
          </div>
        )}

        {!loading && !error && level && (
          <>
            <button
              type="button"
              onClick={() => router.push(`/building/${level.site_id}`)}
              className="text-sm text-neutral-500 transition hover:text-white"
            >
              ← Building
            </button>

            <header className="mt-8">
              <p className="text-xs font-semibold tracking-[0.25em] text-red-500">
                ASERION / LEVEL
              </p>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-semibold">
                    {level.level_name}
                  </h1>

                  <p className="mt-2 text-neutral-500">
                    Building level and associated fire compartments.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded border border-neutral-700 px-3 py-1 font-mono text-xs text-neutral-400">
                    {level.level_code}
                  </span>

                  <span className="text-xs font-semibold tracking-wider text-neutral-500">
                    {level.status || "NO STATUS"}
                  </span>
                </div>
              </div>
            </header>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Fire Compartments
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Compartments linked to this building level.
                  </p>
                </div>

                <span className="text-sm text-neutral-500">
                  {compartments.length}{" "}
                  {compartments.length === 1
                    ? "compartment"
                    : "compartments"}
                </span>
              </div>

              {compartments.length === 0 ? (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    No fire compartments recorded for this level.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {compartments.map((compartment) => (
                    <button
                      key={compartment.id}
                      type="button"
                      onClick={() =>
                        router.push(`/compartment/${compartment.id}`)
                      }
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-5 text-left transition hover:border-neutral-600 hover:bg-neutral-900"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded border border-neutral-700 px-2 py-1 font-mono text-xs text-neutral-400">
                              {compartment.compartment_code}
                            </span>

                            <h3 className="text-lg font-semibold">
                              {compartment.compartment_name}
                            </h3>
                          </div>

                          <p className="mt-3 text-sm text-neutral-500">
                            {compartment.compartment_type ||
                              "No compartment type recorded"}
                          </p>

                          {compartment.description && (
                            <p className="mt-2 text-sm text-neutral-500">
                              {compartment.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wider text-neutral-600">
                              Required Fire Resistance
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                              {compartment.required_fire_resistance_minutes !==
                              null
                                ? `${compartment.required_fire_resistance_minutes} min`
                                : "Not recorded"}
                            </p>

                            <p className="mt-3 text-xs font-semibold tracking-wider text-neutral-500">
                              {compartment.status || "NO STATUS"}
                            </p>
                          </div>

                          <span className="text-neutral-600">→</span>
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