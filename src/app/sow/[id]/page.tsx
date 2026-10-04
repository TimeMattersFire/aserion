"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type ScopeOfWorks = {
  id: string;
  legacy_sow_id: string | null;
  survey_record_id: string;
  system_id: string | null;
  system_configuration_id: string | null;
  description: string | null;
  quantity: number | null;
  status: string | null;
  revision_number: number | null;
  is_current: boolean | null;
  issued_at: string | null;
  approved_at: string | null;
};

type Survey = {
  id: string;
  legacy_survey_record_id: string | null;
  revision_number: number | null;
  status: string | null;
  is_current: boolean | null;
};

type SystemRecord = {
  id: string;
  system_name: string | null;
  system_reference: string | null;
  fire_rating: string | null;
  test_standard: string | null;
  status: string | null;
};

type InstallationRecord = {
  id: string;
  legacy_installation_id: string | null;
  installation_date: string | null;
  installation_status: string | null;
  deviation_from_survey: string | null;
  revision_number: number | null;
  is_current: boolean | null;
};

type ApplicabilityDecision = {
  applicable: boolean;
  reasons: string[] | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ScopeOfWorksDetailPage() {
  const params = useParams();
  const router = useRouter();

  const sowId = params.id as string;

  const [sow, setSow] = useState<ScopeOfWorks | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [system, setSystem] = useState<SystemRecord | null>(null);
  const [installations, setInstallations] = useState<
    InstallationRecord[]
  >([]);
  const [applicability, setApplicability] =
    useState<ApplicabilityDecision | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadScopeOfWorks() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: sowData, error: sowError } = await supabase
        .from("scope_of_works")
        .select(
          "id, legacy_sow_id, survey_record_id, system_id, system_configuration_id, description, quantity, status, revision_number, is_current, issued_at, approved_at"
        )
        .eq("id", sowId)
        .single();

      if (sowError) {
        setError(sowError.message);
        setLoading(false);
        return;
      }

      const { data: surveyData, error: surveyError } =
        await supabase
          .from("survey_records")
          .select(
            "id, legacy_survey_record_id, revision_number, status, is_current"
          )
          .eq("id", sowData.survey_record_id)
          .single();

      if (surveyError) {
        setError(surveyError.message);
        setLoading(false);
        return;
      }

      let systemData: SystemRecord | null = null;

      if (sowData.system_id) {
        const { data: loadedSystem, error: systemError } =
          await supabase
            .from("systems_register")
            .select(
              "id, system_name, system_reference, fire_rating, test_standard, status"
            )
            .eq("id", sowData.system_id)
            .single();

        if (systemError) {
          setError(systemError.message);
          setLoading(false);
          return;
        }

        systemData = loadedSystem;
      }

      const {
        data: installationData,
        error: installationError,
      } = await supabase
        .from("installation_records")
        .select(
          "id, legacy_installation_id, installation_date, installation_status, deviation_from_survey, revision_number, is_current"
        )
        .eq("sow_id", sowData.id)
        .order("revision_number", { ascending: false });

      if (installationError) {
        setError(installationError.message);
        setLoading(false);
        return;
      }

      const { data: applicabilityData, error: applicabilityError } =
        await supabase.rpc(
          "tmfp_system_configuration_applicability",
          {
            p_sow_id: sowData.id,
          }
        );

      if (applicabilityError) {
        setError(applicabilityError.message);
        setLoading(false);
        return;
      }

      setSow(sowData);
      setSurvey(surveyData);
      setSystem(systemData);
      setInstallations(installationData ?? []);

      if (applicabilityData && applicabilityData.length > 0) {
        setApplicability(applicabilityData[0]);
      }

      setLoading(false);
    }

    loadScopeOfWorks();
  }, [router, sowId]);

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {loading && (
          <p className="text-sm text-neutral-400">
            Loading Scope of Works...
          </p>
        )}

        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/20 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load Scope of Works
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && sow && (
          <>
            <button
              type="button"
              onClick={() =>
                router.push(`/survey/${sow.survey_record_id}`)
              }
              className="text-sm text-neutral-500 transition hover:text-white"
            >
              ← Survey
            </button>

            <header className="mt-8">
              <p className="text-xs font-semibold tracking-[0.25em] text-red-500">
                ASERION / SCOPE OF WORKS
              </p>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-semibold">
                    {sow.legacy_sow_id || sow.id}
                  </h1>

                  <p className="mt-3 max-w-3xl text-neutral-400">
                    {sow.description ||
                      "No Scope of Works description recorded"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold tracking-wider text-neutral-500">
                    {sow.status || "NO STATUS"}
                  </p>

                  <p className="mt-2 text-xs font-semibold tracking-wider text-neutral-600">
                    REVISION {sow.revision_number ?? "—"}
                  </p>
                </div>
              </div>
            </header>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Scope Control
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Controlled status and lineage for this Scope of
                Works.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                  label="Status"
                  value={sow.status || "Not recorded"}
                />

                <InfoCard
                  label="Record Position"
                  value={
                    sow.is_current
                      ? "Current record"
                      : "Historical record"
                  }
                />

                <InfoCard
                  label="Issued"
                  value={formatDate(sow.issued_at)}
                />

                <InfoCard
                  label="Approved"
                  value={formatDate(sow.approved_at)}
                />
              </div>
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Source Survey
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                The controlled Survey record from which this Scope
                of Works was defined.
              </p>

              {survey ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/survey/${survey.id}`)
                  }
                  className="mt-6 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-5 text-left transition hover:border-neutral-600 hover:bg-neutral-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-600">
                        Survey Reference
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {survey.legacy_survey_record_id ||
                          survey.id}
                      </p>
                    </div>

                    <p className="text-xs font-semibold tracking-wider text-neutral-500">
                      REVISION {survey.revision_number ?? "—"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-6 text-sm text-neutral-400">
                    <span>
                      Status: {survey.status || "Not recorded"}
                    </span>

                    <span>
                      {survey.is_current
                        ? "Current Survey"
                        : "Historical Survey"}
                    </span>
                  </div>
                </button>
              ) : (
                <p className="mt-6 text-sm text-neutral-400">
                  No source Survey available.
                </p>
              )}
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Selected System
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                The controlled system referenced by this Scope of
                Works.
              </p>

              {system ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      System
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {system.system_name || "Not recorded"}
                    </p>

                    <p className="mt-2 text-sm text-neutral-500">
                      {system.system_reference ||
                        "No reference recorded"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Technical Position
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                      {system.fire_rating ||
                        "Fire rating not recorded"}
                    </p>

                    <p className="mt-2 text-sm text-neutral-500">
                      {system.test_standard ||
                        "Test standard not recorded"}
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      {system.status || "Status not recorded"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    No controlled system is linked to this Scope of
                    Works.
                  </p>
                </div>
              )}
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Selected Configuration
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                The configuration remains controlled within the
                protected ASERION technical layer.
              </p>

              <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                <p className="text-xs uppercase tracking-wider text-neutral-600">
                  Configuration Link
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {sow.system_configuration_id
                    ? "Controlled configuration linked"
                    : "No configuration linked"}
                </p>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Raw configuration parameters are not read directly
                  by this Cockpit page. Applicability is evaluated
                  by the authorised backend control below.
                </p>
              </div>
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Configuration Applicability
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Authorised applicability result returned by the
                existing ASERION backend control.
              </p>

              {applicability ? (
                <div
                  className={`mt-6 rounded-lg border p-5 ${
                    applicability.applicable
                      ? "border-neutral-700 bg-neutral-950"
                      : "border-red-900 bg-red-950/20"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wider text-neutral-600">
                    Applicability
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {applicability.applicable
                      ? "APPLICABLE"
                      : "NOT APPLICABLE"}
                  </p>

                  {applicability.reasons &&
                  applicability.reasons.length > 0 ? (
                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-wider text-neutral-600">
                        Reasons
                      </p>

                      <ul className="mt-2 space-y-2 text-sm text-neutral-300">
                        {applicability.reasons.map(
                          (reason, index) => (
                            <li key={`${reason}-${index}`}>
                              {reason}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-neutral-400">
                      No applicability exceptions were returned.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    No authorised applicability result is available.
                  </p>
                </div>
              )}
            </section>

            <div className="my-8 border-t border-neutral-800" />

            <section>
              <h2 className="text-xl font-semibold">
                Installation Records
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Installation records directly linked to this
                controlled Scope of Works.
              </p>

              {installations.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {installations.map((installation) => (
                    <button
                      key={installation.id}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/installation/${installation.id}`
                        )
                      }
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-5 text-left transition hover:border-neutral-600 hover:bg-neutral-900"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-600">
                            Installation Reference
                          </p>

                          <p className="mt-2 text-xl font-semibold">
                            {installation.legacy_installation_id ||
                              "Installation Record"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold tracking-wider text-red-500">
                            {installation.installation_status ||
                              "NO STATUS"}
                          </p>

                          <p className="mt-2 text-xs text-neutral-600">
                            Revision{" "}
                            {installation.revision_number ?? "—"}
                          </p>

                          <p className="mt-1 text-xs text-neutral-600">
                            {installation.is_current
                              ? "CURRENT INSTALLATION"
                              : "HISTORICAL INSTALLATION"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 border-t border-neutral-800 pt-5 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-600">
                            Installation Date
                          </p>

                          <p className="mt-1 text-sm text-neutral-300">
                            {formatDate(
                              installation.installation_date
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-600">
                            Deviation from Survey
                          </p>

                          <p className="mt-1 text-sm text-neutral-300">
                            {installation.deviation_from_survey ||
                              "Not recorded"}
                          </p>
                        </div>
                      </div>

                      <p className="mt-5 text-sm font-medium text-red-400">
                        Open controlled Installation →
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm font-semibold text-white">
                    No Installation record is linked to this Scope
                    of Works.
                  </p>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                    ASERION has not inferred an installation from
                    another location, system or workflow record. An
                    installation must reference this Scope of Works
                    directly before it is presented here.
                  </p>
                </div>
              )}
            </section>

            <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-950 p-5">
              <p className="text-xs font-semibold tracking-[0.18em] text-red-500">
                CONTROLLED DEMONSTRATION DATA
              </p>

              <p className="mt-2 text-sm leading-6 text-neutral-400">
                This page presents controlled ASERION records and
                backend applicability results. The demonstration
                system and configuration are synthetic and are not
                valid for real fire-stopping design, specification
                or installation.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
      <p className="text-xs uppercase tracking-wider text-neutral-600">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}