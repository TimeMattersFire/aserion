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

function displayValue(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return value;
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

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
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

export default function JobPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const jobId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    let active = true;

    async function loadJob() {
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
      setLoading(false);
    }

    loadJob();

    return () => {
      active = false;
    };
  }, [jobId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0b0c] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-white/50">
            Loading controlled Job record...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !job) {
    return (
      <main className="min-h-screen bg-[#0b0b0c] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="font-semibold text-red-300">
              Job unavailable
            </p>
            <p className="mt-2 text-sm leading-6 text-white/50">
              {errorMessage ?? "The controlled Job could not be loaded."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0c] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
            ASERION / Controlled Job
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {job.job_name ?? job.project_number ?? "Job"}
          </h1>

          <p className="mt-2 text-sm text-white/50">
            {job.project_number ?? job.legacy_job_id ?? job.id}
          </p>
        </div>

        <section className="mb-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailCard label="Status" value={job.status} />
            <DetailCard
              label="Project Number"
              value={job.project_number}
            />
            <DetailCard
              label="Legacy Job Reference"
              value={job.legacy_job_id}
            />
            <DetailCard
              label="Start Date"
              value={formatDate(job.start_date)}
            />
            <DetailCard
              label="Completion Date"
              value={formatDate(job.completion_date)}
            />
            <DetailCard label="Controlled Job ID" value={job.id} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Final Handover
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Controlled Final Handover Readiness
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
            Open the controlled Final Handover record to review the
            current V5 readiness decision and configured handover
            requirements for this Job.
          </p>

          <button
            type="button"
            onClick={() => router.push(`/handover/${job.id}`)}
            className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"
          >
            Open Final Handover →
          </button>
        </section>
      </div>
    </main>
  );
}