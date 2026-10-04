"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Job = {
  id: string;
  legacy_job_id: string | null;
  project_number: string | null;
  job_name: string | null;
  status: string | null;
  start_date: string | null;
  completion_date: string | null;
};

type HandoverReadiness = {
  ready: boolean;
  reasons: string[];
};

type RequirementSummary = {
  ready: boolean;
  required_count: number;
  satisfied_count: number;
  outstanding_count: number;
  reasons: string[];
};

type JobRequirement = {
  id: string;
};

type RequirementAssessment = {
  job_requirement_id: string;
  requirement_code: string | null;
  requirement_name: string | null;
  requirement_type: string | null;
  required: boolean;
  satisfied: boolean;
  status: string | null;
  reason: string | null;
};

function displayValue(
  value: string | number | null | undefined
) {
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  return String(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normaliseReasons(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm text-zinc-100">
        {displayValue(value)}
      </p>
    </div>
  );
}

function requirementStatusClasses(
  status: string | null,
  satisfied: boolean
) {
  const normalised = status?.trim().toLowerCase();

  if (
    satisfied ||
    normalised === "complete" ||
    normalised === "not_required"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (
    normalised === "blocked" ||
    normalised === "missing" ||
    normalised === "missing_file" ||
    normalised === "not_current" ||
    normalised === "expired"
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

export default function HandoverPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const jobId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  const [job, setJob] = useState<Job | null>(null);

  const [handover, setHandover] =
    useState<HandoverReadiness | null>(null);

  const [summary, setSummary] =
    useState<RequirementSummary | null>(null);

  const [requirements, setRequirements] = useState<
    RequirementAssessment[]
  >([]);

  const [handoverAvailable, setHandoverAvailable] =
    useState(true);

  const [summaryAvailable, setSummaryAvailable] =
    useState(true);

  const [requirementsAvailable, setRequirementsAvailable] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function loadHandover() {
      if (!jobId) {
        if (active) {
          setErrorMessage("Job record is unavailable.");
          setLoading(false);
        }

        return;
      }

      setLoading(true);
      setErrorMessage(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (sessionError || !session) {
        router.replace("/login");
        return;
      }

      const {
        data: jobData,
        error: jobError,
      } = await supabase
        .from("jobs")
        .select(
          "id, legacy_job_id, project_number, job_name, status, start_date, completion_date"
        )
        .eq("id", jobId)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (jobError || !jobData) {
        setErrorMessage(
          "This job is unavailable or you do not have access to it."
        );
        setLoading(false);
        return;
      }

      setJob(jobData as Job);

      const {
        data: handoverData,
        error: handoverError,
      } = await supabase.rpc("tmfp_handover_readiness", {
        p_job_id: jobId,
      });

      if (!active) {
        return;
      }

      if (handoverError) {
        setHandoverAvailable(false);
        setHandover(null);
      } else {
        const firstHandover = Array.isArray(handoverData)
          ? handoverData[0]
          : handoverData;

        if (firstHandover) {
          setHandover({
            ready: Boolean(firstHandover.ready),
            reasons: normaliseReasons(firstHandover.reasons),
          });
        } else {
          setHandover(null);
        }
      }

      const {
        data: summaryData,
        error: summaryError,
      } = await supabase.rpc(
        "tmfp_job_handover_requirements_readiness",
        {
          p_job_id: jobId,
        }
      );

      if (!active) {
        return;
      }

      if (summaryError) {
        setSummaryAvailable(false);
        setSummary(null);
      } else {
        const firstSummary = Array.isArray(summaryData)
          ? summaryData[0]
          : summaryData;

        if (firstSummary) {
          setSummary({
            ready: Boolean(firstSummary.ready),
            required_count: Number(
              firstSummary.required_count ?? 0
            ),
            satisfied_count: Number(
              firstSummary.satisfied_count ?? 0
            ),
            outstanding_count: Number(
              firstSummary.outstanding_count ?? 0
            ),
            reasons: normaliseReasons(firstSummary.reasons),
          });
        } else {
          setSummary(null);
        }
      }

      const {
        data: requirementRows,
        error: requirementRowsError,
      } = await supabase
        .from("job_handover_requirements")
        .select("id")
        .eq("job_id", jobId);

      if (!active) {
        return;
      }

      if (requirementRowsError) {
        setRequirementsAvailable(false);
        setRequirements([]);
      } else {
        const controlledRows =
          (requirementRows ?? []) as JobRequirement[];

        const assessments: RequirementAssessment[] = [];

        for (const requirement of controlledRows) {
          const {
            data: assessmentData,
            error: assessmentError,
          } = await supabase.rpc(
            "tmfp_job_handover_requirement_assessment",
            {
              p_job_requirement_id: requirement.id,
            }
          );

          if (!active) {
            return;
          }

          if (assessmentError) {
            setRequirementsAvailable(false);
            continue;
          }

          const firstAssessment = Array.isArray(assessmentData)
            ? assessmentData[0]
            : assessmentData;

          if (!firstAssessment) {
            continue;
          }

          assessments.push({
            job_requirement_id: requirement.id,
            requirement_code:
              firstAssessment.requirement_code ?? null,
            requirement_name:
              firstAssessment.requirement_name ?? null,
            requirement_type:
              firstAssessment.requirement_type ?? null,
            required: Boolean(firstAssessment.required),
            satisfied: Boolean(firstAssessment.satisfied),
            status: firstAssessment.status ?? null,
            reason: firstAssessment.reason ?? null,
          });
        }

        assessments.sort((a, b) => {
          if (a.satisfied !== b.satisfied) {
            return a.satisfied ? 1 : -1;
          }

          return (
            a.requirement_name ?? ""
          ).localeCompare(b.requirement_name ?? "");
        });

        setRequirements(assessments);
      }

      setLoading(false);
    }

    loadHandover();

    return () => {
      active = false;
    };
  }, [jobId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-sm text-zinc-400">
            Loading controlled Final Handover position...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !job) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-8 text-sm text-zinc-400 transition hover:text-white"
          >
            ← Back
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm font-semibold text-red-300">
              Final Handover unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {errorMessage ??
                "The controlled Handover position could not be retrieved."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const handoverReasons = handover?.reasons ?? [];

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back
        </button>

        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
            ASERION / FINAL HANDOVER
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {job.job_name ?? "Controlled Job"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                Final controlled handover position across the
                current assurance chain and required handover
                information.
              </p>
            </div>

            {handoverAvailable && handover ? (
              <span
                className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${
                  handover.ready
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {handover.ready
                  ? "FINAL HANDOVER READY"
                  : "FINAL HANDOVER NOT READY"}
              </span>
            ) : (
              <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
                READINESS UNAVAILABLE
              </span>
            )}
          </div>
        </header>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Job Control
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Controlled job context
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailCard
              label="Legacy Job ID"
              value={job.legacy_job_id}
            />

            <DetailCard
              label="Project Number"
              value={job.project_number}
            />

            <DetailCard
              label="Job Status"
              value={job.status}
            />

            <DetailCard
              label="Job ID"
              value={job.id}
            />

            <DetailCard
              label="Start Date"
              value={formatDate(job.start_date)}
            />

            <DetailCard
              label="Completion Date"
              value={formatDate(job.completion_date)}
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Final Decision
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              V5 Final Handover readiness
            </h2>
          </div>

          {!handoverAvailable ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <p className="text-sm font-semibold text-amber-300">
                Final Handover decision unavailable
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                The job is visible, but the controlled V5
                Handover readiness engine could not be executed
                in this authenticated session.
              </p>
            </div>
          ) : handover ? (
            <div
              className={`rounded-2xl border p-6 ${
                handover.ready
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Current V5 Decision
                  </p>

                  <p
                    className={`mt-2 text-2xl font-semibold ${
                      handover.ready
                        ? "text-emerald-300"
                        : "text-red-300"
                    }`}
                  >
                    {handover.ready
                      ? "READY"
                      : "NOT READY"}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                    handover.ready
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {handoverReasons.length} blocking{" "}
                  {handoverReasons.length === 1
                    ? "reason"
                    : "reasons"}
                </span>
              </div>

              {handoverReasons.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {handoverReasons.map((reason, index) => (
                    <div
                      key={`${reason}-${index}`}
                      className="rounded-xl border border-red-500/10 bg-black/20 p-4"
                    >
                      <p className="text-sm leading-6 text-zinc-300">
                        {reason}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  The V5 Final Handover engine returned no
                  blocking reasons for this job.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-zinc-400">
                No Final Handover decision was returned.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Handover Requirements
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Controlled requirement position
            </h2>
          </div>

          {!summaryAvailable ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <p className="text-sm font-semibold text-amber-300">
                Requirement summary unavailable
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                The controlled requirement-readiness engine
                could not be executed in this session.
              </p>
            </div>
          ) : summary ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DetailCard
                  label="Required"
                  value={summary.required_count}
                />

                <DetailCard
                  label="Satisfied"
                  value={summary.satisfied_count}
                />

                <DetailCard
                  label="Outstanding"
                  value={summary.outstanding_count}
                />

                <DetailCard
                  label="Requirement Gate"
                  value={summary.ready ? "READY" : "NOT READY"}
                />
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full bg-white/30 transition-all"
                  style={{
                    width:
                      summary.required_count > 0
                        ? `${Math.min(
                            100,
                            Math.max(
                              0,
                              (summary.satisfied_count /
                                summary.required_count) *
                                100
                            )
                          )}%`
                        : "0%",
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-zinc-600">
                {summary.satisfied_count} of{" "}
                {summary.required_count} required handover
                requirements currently satisfied.
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-zinc-400">
                No Handover requirement summary was returned.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Requirement Assessment
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Individual controlled gates
            </h2>
          </div>

          {!requirementsAvailable ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <p className="text-sm font-semibold text-amber-300">
                Requirement detail unavailable
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Some or all individual Handover requirement
                assessments could not be retrieved in this
                authenticated session.
              </p>
            </div>
          ) : requirements.length > 0 ? (
            <div className="space-y-4">
              {requirements.map((requirement) => (
                <div
                  key={requirement.job_requirement_id}
                  className="rounded-2xl border border-white/10 bg-[#111113] p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                        {displayValue(
                          requirement.requirement_code
                        )}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {displayValue(
                          requirement.requirement_name
                        )}
                      </h3>

                      <p className="mt-2 text-xs text-zinc-500">
                        {displayValue(
                          requirement.requirement_type
                        )}
                        {" · "}
                        {requirement.required
                          ? "Required"
                          : "Not required"}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${requirementStatusClasses(
                        requirement.status,
                        requirement.satisfied
                      )}`}
                    >
                      {displayValue(requirement.status)}
                    </span>
                  </div>

                  <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                      Assessment
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {displayValue(requirement.reason)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-zinc-400">
                No controlled Handover requirements were
                returned for this job.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-white/10 pt-6">
          <p className="max-w-4xl text-xs leading-6 text-zinc-600">
            ASERION presents the current output of the controlled
            V5 Final Handover and requirement-readiness engines.
            A READY result records that the configured controlled
            gates have been satisfied for the current information
            chain. It is not, by itself, a declaration that the
            building or wider fire strategy is safe or compliant.
            Technical, regulatory and operational decisions remain
            subject to the applicable controlled process and
            competent review.
          </p>
        </section>
      </div>
    </main>
  );
}