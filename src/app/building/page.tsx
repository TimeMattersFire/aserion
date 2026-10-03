"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Site = {
  id: string;
  legacy_site_id: string | null;
  site_name: string;
  address: string | null;
};

export default function BuildingPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSites() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("sites")
        .select("id, legacy_site_id, site_name, address")
        .order("site_name");

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSites(data ?? []);
      setLoading(false);
    }

    loadSites();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-red-500">
          ASERION
        </p>

        <h1 className="mt-3 text-4xl font-semibold">Buildings</h1>

        <p className="mt-2 text-neutral-500">
          Sites accessible to the authenticated user.
        </p>

        <div className="my-8 border-t border-neutral-800" />

        {loading && (
          <p className="text-sm text-neutral-400">Loading buildings...</p>
        )}

        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/20 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load buildings
            </p>
            <p className="mt-2 text-sm text-neutral-400">{error}</p>
          </div>
        )}

        {!loading && !error && sites.length === 0 && (
          <p className="text-sm text-neutral-400">
            No accessible buildings returned.
          </p>
        )}

        {!loading && !error && sites.length > 0 && (
          <div className="grid gap-4">
            {sites.map((site) => (
              <article
                key={site.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{site.site_name}</h2>

                    <p className="mt-1 text-sm text-neutral-500">
                      {site.address || "No address recorded"}
                    </p>
                  </div>

                  <span className="rounded border border-neutral-700 px-3 py-1 font-mono text-xs text-neutral-400">
                    {site.legacy_site_id || "NO LEGACY REF"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}