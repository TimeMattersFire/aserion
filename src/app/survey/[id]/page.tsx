"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type SurveyRecord = {
  id: string;
  legacy_survey_record_id: string | null;
  location_id: string;
  survey_date: string | null;
  status: string | null;
  required_fire_rating: string | null;
  substrate_compartment: string | null;
  breach_position: string | null;
  service_type: string | null;
  service_material: string | null;
  service_size: string | null;
  service_diameter_mm: number | null;
  service_width_mm: number | null;
  service_height_mm: number | null;
  supporting_construction_thickness_mm: number | null;
  annular_gap_min_mm: number | null;
  annular_gap_max_mm: number | null;
  compliance_status: string | null;
  considered_risk: string | null;
  comments: string | null;
  revision_number: number | null;
  is_current: boolean | null;
  completed_at: string | null;
};

type LocationRecord = {
  id: string;
  legacy_location_id: string | null;
  penetration_id: string | null;
  location_area_room: string | null;
  status: string | null;
};

type ScopeOfWorksRecord = {
  id: string;
  legacy_sow_id: string | null;
  description: string | null;
  quantity: number | null;
  status: string | null;
  revision_number: number | null;
  is_current: boolean | null;
  issued_at: string | null;
  approved_at: string | null;
};

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();

  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<SurveyRecord | null>(
    null
  );
  const [location, setLocation] =
    useState<LocationRecord | null>(null);
  const [scopeOfWorks, setScopeOfWorks] =
    useState<ScopeOfWorksRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSurvey() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: surveyData, error: surveyError } =
        await supabase
          .from("survey_records")
          .select(
            "id, legacy_survey_record_id, location_id, survey_date, status, required_fire_rating, substrate_compartment, breach_position, service_type, service_material, service_size, service_diameter_mm, service_width_mm, service_height_mm, supporting_construction_thickness_mm, annular_gap_min_mm, annular_gap_max_mm, compliance_status, considered_risk, comments, revision_number, is_current, completed_at"
          )
          .eq("id", surveyId)
          .single();

      if (surveyError) {
        setError(surveyError.message);
        setLoading(false);
        return;
      }

      const { data: locationData, error: locationError } =
        await supabase
          .from("locations")
          .select(
            "id, legacy_location_id, penetration_id, location_area_room, status"
          )
          .eq("id", surveyData.location_id)
          .single();

      if (locationError) {
        setError(locationError.message);
        setLoading(false);
        return;
      }

      const { data: sowData, error: sowError } =
        await supabase
          .from("scope_of_works")
          .select(
            "id, legacy_sow_id, description, quantity, status, revision_number, is_current, issued_at, approved_at"
          )
          .eq("survey_record_id", surveyData.id)
          .order("revision_number", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (sowError) {
        setError(sowError.message);
        setLoading(false);
        return;
      }

      setSurvey(surveyData);
      setLocation(locationData);
      setScopeOfWorks(sowData);
      setLoading(false);
    }

    loadSurvey();
  }, [router, surveyId]);

  function formatDate(value: string | null) {
    if (!value) {
      return "Not recorded";
    }

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {loading && (
          <p className="text-sm text-neutral-400">
            Loading survey...
          </p>
        )}

        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/20 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load survey
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && survey && (
          <>
            <button
              type="button"
              onClick={() => {
                if (location?.penetration_id) {
                  router.push(
                    `/penetration/${location.penetration_id}`
                  );
                } else {
                  router.back();
                }
              }}
              className="text-sm text-neutral-500 transition hover:text-white"
            >
              ← Penetration
            </button>

            <header className="mt-8">
              <p className="text-xs font-semibold tracking-[0.25em] text-red-500">
                ASERION / SURVEY
              </p>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-semibold">
                    {survey.legacy_survey_record_id ||
                      "Survey Record"}
                  </h1>

                  <p className="mt-3 text-neutral-400">
                    Controlled survey record for the selected
                    penetration location.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold tracking-wider text-neutral-500">
                    {survey.status || "NO STATUS"}
                  </p>

                  <p className="mt-2 text-sm text-neutral-600">
                    {survey.revision_number !== null
                      ? `Revision ${survey.revision_number}`
                      : "No revision"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-600">
                    {survey.is_current
                      ? "CURRENT RECORD"
                      : "SUPERSEDED RECORD"}
                  </p>
                </div>
              </div>
            </header>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Survey Context
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Recorded survey position and controlled location
                context.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Location Reference
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    {location?.legacy_location_id ||
                      "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Area / Room
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    {location?.location_area_room ||
                      "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Required Fire Rating
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    {survey.required_fire_rating ||
                      "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Survey Date
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    {formatDate(survey.survey_date)}
                  </p>
                </div>
              </div>
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Supporting Construction
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Construction condition recorded during the survey.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Construction
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.substrate_compartment ||
                      "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Construction Thickness
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.supporting_construction_thickness_mm !==
                    null
                      ? `${survey.supporting_construction_thickness_mm} mm`
                      : "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Breach Position
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.breach_position || "Not recorded"}
                  </p>
                </div>
              </div>
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Service Details
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Service and opening information captured by the
                survey.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Service Type
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.service_type || "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Service Material
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.service_material || "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Recorded Service Size
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.service_size || "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Service Diameter
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.service_diameter_mm !== null
                      ? `${survey.service_diameter_mm} mm`
                      : "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Service Width
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.service_width_mm !== null
                      ? `${survey.service_width_mm} mm`
                      : "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Service Height
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.service_height_mm !== null
                      ? `${survey.service_height_mm} mm`
                      : "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Annular Gap
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.annular_gap_min_mm !== null &&
                    survey.annular_gap_max_mm !== null
                      ? `${survey.annular_gap_min_mm}–${survey.annular_gap_max_mm} mm`
                      : "Not recorded"}
                  </p>
                </div>
              </div>
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Scope of Works
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Scope directly linked to this controlled survey
                revision.
              </p>

              {scopeOfWorks ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/sow/${scopeOfWorks.id}`)
                  }
                  className="mt-6 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-5 text-left transition hover:border-neutral-600 hover:bg-neutral-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-600">
                        Scope Reference
                      </p>

                      <p className="mt-2 text-xl font-semibold text-white">
                        {scopeOfWorks.legacy_sow_id ||
                          "Scope of Works"}
                      </p>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
                        {scopeOfWorks.description ||
                          "No scope description recorded"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold tracking-wider text-red-500">
                        {scopeOfWorks.status || "NO STATUS"}
                      </p>

                      <p className="mt-2 text-xs text-neutral-600">
                        {scopeOfWorks.revision_number !== null
                          ? `Revision ${scopeOfWorks.revision_number}`
                          : "No revision"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-600">
                        {scopeOfWorks.is_current
                          ? "CURRENT SOW RECORD"
                          : "SUPERSEDED SOW RECORD"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-neutral-800 pt-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-600">
                        Quantity
                      </p>

                      <p className="mt-1 text-sm text-neutral-300">
                        {scopeOfWorks.quantity ?? "Not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-600">
                        Issued
                      </p>

                      <p className="mt-1 text-sm text-neutral-300">
                        {formatDate(scopeOfWorks.issued_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-600">
                        Approved
                      </p>

                      <p className="mt-1 text-sm text-neutral-300">
                        {formatDate(scopeOfWorks.approved_at)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm font-medium text-red-400">
                    Open controlled Scope of Works →
                  </p>
                </button>
              ) : (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm font-semibold text-white">
                    No Scope of Works exists for this survey
                    revision.
                  </p>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                    ASERION has not carried a Scope of Works
                    forward from another survey revision. A scope
                    must be directly linked to this controlled
                    survey record before it is presented here.
                  </p>
                </div>
              )}
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section className="pb-10">
              <h2 className="text-xl font-semibold">
                Survey Assessment
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Recorded assessment information. These fields
                present the controlled record and do not
                independently determine compliance.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Compliance Status
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.compliance_status || "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Considered Risk
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {survey.considered_risk || "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Survey Comments
                  </p>

                  <p className="mt-2 text-base leading-7 text-neutral-300">
                    {survey.comments || "No comments recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Completed
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {formatDate(survey.completed_at)}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}