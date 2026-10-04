"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Penetration = {
  id: string;
  boundary_id: string;
  penetration_code: string;
  description: string | null;
  physical_location: string | null;
  status: string | null;
};

type Location = {
  id: string;
  legacy_location_id: string | null;
  location_area_room: string | null;
  status: string | null;
};

type AssuranceDecision = {
  assurance_state: string | null;
  reassessment_state: string | null;
  decision_severity: string | null;
  decision_reason: string | null;
  required_action: string | null;
};

export default function PenetrationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const penetrationId = params.id as string;

  const [penetration, setPenetration] =
    useState<Penetration | null>(null);

  const [location, setLocation] =
    useState<Location | null>(null);

  const [decision, setDecision] =
    useState<AssuranceDecision | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPenetration() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const {
        data: penetrationData,
        error: penetrationError,
      } = await supabase
        .from("penetrations")
        .select(
          "id, boundary_id, penetration_code, description, physical_location, status"
        )
        .eq("id", penetrationId)
        .single();

      if (penetrationError) {
        setError(penetrationError.message);
        setLoading(false);
        return;
      }

      const {
        data: locationData,
        error: locationError,
      } = await supabase
        .from("locations")
        .select(
          "id, legacy_location_id, location_area_room, status"
        )
        .eq("penetration_id", penetrationId)
        .maybeSingle();

      if (locationError) {
        setError(locationError.message);
        setLoading(false);
        return;
      }

      let decisionData: AssuranceDecision | null = null;

      if (locationData) {
        const {
          data: assuranceData,
          error: assuranceError,
        } = await supabase.rpc(
          "tmfp_location_assurance_decision",
          {
            p_location_id: locationData.id,
          }
        );

        if (assuranceError) {
          setError(assuranceError.message);
          setLoading(false);
          return;
        }

        if (assuranceData && assuranceData.length > 0) {
          decisionData = assuranceData[0];
        }
      }

      setPenetration(penetrationData);
      setLocation(locationData);
      setDecision(decisionData);
      setLoading(false);
    }

    loadPenetration();
  }, [router, penetrationId]);

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {loading && (
          <p className="text-sm text-neutral-400">
            Loading penetration...
          </p>
        )}

        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/20 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load penetration
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && penetration && (
          <>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/boundary/${penetration.boundary_id}`
                )
              }
              className="text-sm text-neutral-500 transition hover:text-white"
            >
              ← Boundary
            </button>

            <header className="mt-8">
              <p className="text-xs font-semibold tracking-[0.25em] text-red-500">
                ASERION / PENETRATION
              </p>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-semibold">
                    {penetration.penetration_code}
                  </h1>

                  <p className="mt-3 max-w-3xl text-neutral-400">
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
            </header>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Controlled Location
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                The controlled ASERION location linked to this
                penetration.
              </p>

              {location ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Location Reference
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {location.legacy_location_id ||
                        location.id}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Area / Room
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {location.location_area_room ||
                        "Not recorded"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    No controlled location is linked to this
                    penetration.
                  </p>
                </div>
              )}
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Current Assurance Position
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Authorised decision returned by the existing
                ASERION assurance-control function.
              </p>

              {!decision ? (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    No authorised assurance decision is
                    available for this location.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Assurance State
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {decision.assurance_state ||
                        "Not available"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Reassessment State
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {decision.reassessment_state ||
                        "Not available"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Decision Severity
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {decision.decision_severity ||
                        "Not available"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Location Status
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {location?.status || "Not available"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 md:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Decision Reason
                    </p>

                    <p className="mt-2 text-base text-neutral-300">
                      {decision.decision_reason ||
                        "No decision reason returned"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 md:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Required Action
                    </p>

                    <p className="mt-2 text-base font-medium">
                      {decision.required_action ||
                        "No required action returned"}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}