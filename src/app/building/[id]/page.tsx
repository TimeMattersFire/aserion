"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Site = {
  id: string;
  legacy_site_id: string | null;
  site_name: string;
  address: string | null;
};

type BuildingLevel = {
  id: string;
  level_code: string;
  level_name: string;
  level_number: number | null;
  description: string | null;
  status: string | null;
};

export default function BuildingDetailPage() {
  const params = useParams();
  const router = useRouter();

  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [levels, setLevels] = useState<BuildingLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBuilding() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: siteData, error: siteError } = await supabase
        .from("sites")
        .select("id, legacy_site_id, site_name, address")
        .eq("id", siteId)
        .single();

      if (siteError) {
        setError(siteError.message);
        setLoading(false);
        return;
      }

      const { data: levelData, error: levelError } = await supabase
        .from("building_levels")
        .select(
          "id, level_code, level_name, level_number, description, status"
        )
        .eq("site_id", siteId)
        .order("level_number");

      if (levelError) {
        setError(levelError.message);
        setLoading(false);
        return;
      }

      setSite(siteData);
      setLevels(levelData ?? []);
      setLoading(false);
    }

    loadBuilding();
  }, [router, siteId]);

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/building")}
          className="text-sm text-neutral-500 transition hover:text-white"
        >
          ← Buildings
        </button>

        {loading && (
          <p className="mt-8 text-sm text-neutral-400">
            Loading building...
          </p>
        )}

        {error && (
          <div className="mt-8 rounded-md border border-red-900 bg-red-950/20 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load building
            </p>

            <p className="mt-2 text-sm text-neutral-400">{error}</p>
          </div>
        )}

        {!loading && !error && site && (
          <>
            <header className="mt-8">
              <p className="text-xs font-semibold tracking-[0.25em] text-red-500">
                ASERION / BUILDING
              </p>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-semibold">
                    {site.site_name}
                  </h1>

                  <p className="mt-2 text-neutral-500">
                    {site.address || "No address recorded"}
                  </p>
                </div>

                <span className="rounded border border-neutral-700 px-3 py-1 font-mono text-xs text-neutral-400">
                  {site.legacy_site_id || "NO LEGACY REF"}
                </span>
              </div>
            </header>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Levels</h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Building levels linked to this site.
                  </p>
                </div>

                <span className="text-sm text-neutral-500">
                  {levels.length} {levels.length === 1 ? "level" : "levels"}
                </span>
              </div>

              {levels.length === 0 ? (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    No levels recorded for this building.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => router.push(`/level/${level.id}`)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-5 text-left transition hover:border-neutral-600 hover:bg-neutral-900"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="rounded border border-neutral-700 px-2 py-1 font-mono text-xs text-neutral-400">
                              {level.level_code}
                            </span>

                            <h3 className="text-lg font-semibold">
                              {level.level_name}
                            </h3>
                          </div>

                          {level.description && (
                            <p className="mt-3 text-sm text-neutral-500">
                              {level.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-semibold tracking-wider text-neutral-500">
                            {level.status || "NO STATUS"}
                          </span>

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