"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Reinspection = {
  id: string;
  legacy_reinspection_id: string | null;
  ncr_id: string;
  reinspector_id: string;
  reinspection_date: string | null;
  result: string | null;
  comments: string | null;
  completed: boolean | null;
  job_id: string;
};

type Ncr = {
  id: string;
  legacy_ncr_id: string | null;
  inspection_id: string;
  defect_type: string | null;
  defect_description: string | null;
  severity: string | null;
  priority: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  ncr_status: string | null;
  raised_date: string | null;
  target_date: string | null;
  closed_date: string | null;
  reinspection_required: boolean | null;
};

type Inspection = {
  id: string;
  legacy_inspection_id: string | null;
  installation_id: string;
  inspection_date: string | null;
  inspection_status: string | null;
  compliance_status: string | null;
  result: string | null;
  comments: string | null;
  inspection_sequence: number | null;
  inspection_slot: number | null;
  is_current: boolean | null;
};

type PhotoEvidence = {
  id: string;
  legacy_photo_id: string | null;
  photo_stage: string | null;
  file_path: string;
  caption: string | null;
  taken_at: string | null;
  uploaded_at: string | null;
  signed_url?: string | null;
};

function displayValue(value: string | number | null | undefined) {
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

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resultClasses(result: string | null) {
  const normalised = result?.trim().toLowerCase();

  if (normalised === "pass") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (normalised === "fail") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

function statusClasses(status: string | null) {
  const normalised = status?.trim().toLowerCase();

  if (normalised === "closed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (normalised === "open") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
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

export default function ReinspectionPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const reinspectionId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reinspection, setReinspection] = useState<Reinspection | null>(null);
  const [ncr, setNcr] = useState<Ncr | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [photos, setPhotos] = useState<PhotoEvidence[]>([]);

  useEffect(() => {
    let active = true;

    async function loadReinspection() {
      if (!reinspectionId) {
        if (active) {
          setErrorMessage("Reinspection record is unavailable.");
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
        data: reinspectionData,
        error: reinspectionError,
      } = await supabase
        .from("reinspections")
        .select(
          "id, legacy_reinspection_id, ncr_id, reinspector_id, reinspection_date, result, comments, completed, job_id"
        )
        .eq("id", reinspectionId)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (reinspectionError || !reinspectionData) {
        setErrorMessage(
          "This reinspection record is unavailable or you do not have access to it."
        );
        setLoading(false);
        return;
      }

      const controlledReinspection = reinspectionData as Reinspection;
      setReinspection(controlledReinspection);

      const { data: ncrData, error: ncrError } = await supabase
        .from("defects_ncr")
        .select(
          "id, legacy_ncr_id, inspection_id, defect_type, defect_description, severity, priority, root_cause, corrective_action, ncr_status, raised_date, target_date, closed_date, reinspection_required"
        )
        .eq("id", controlledReinspection.ncr_id)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (ncrError) {
        setErrorMessage(
          "The reinspection was loaded, but its linked NCR could not be retrieved."
        );
        setLoading(false);
        return;
      }

      const controlledNcr = ncrData as Ncr | null;
      setNcr(controlledNcr);

      if (controlledNcr?.inspection_id) {
        const {
          data: inspectionData,
          error: inspectionError,
        } = await supabase
          .from("inspections")
          .select(
            "id, legacy_inspection_id, installation_id, inspection_date, inspection_status, compliance_status, result, comments, inspection_sequence, inspection_slot, is_current"
          )
          .eq("id", controlledNcr.inspection_id)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (inspectionError) {
          setErrorMessage(
            "The NCR was loaded, but its source inspection could not be retrieved."
          );
          setLoading(false);
          return;
        }

        setInspection(inspectionData as Inspection | null);
      }

      const { data: photoData, error: photoError } = await supabase
        .from("photo_evidence")
        .select(
          "id, legacy_photo_id, photo_stage, file_path, caption, taken_at, uploaded_at"
        )
        .eq("reinspection_id", controlledReinspection.id)
        .order("taken_at", { ascending: true });

      if (!active) {
        return;
      }

      if (photoError) {
        setErrorMessage(
          "The reinspection was loaded, but its evidence records could not be retrieved."
        );
        setLoading(false);
        return;
      }

      const evidenceRows = (photoData ?? []) as PhotoEvidence[];

      if (evidenceRows.length > 0) {
        const evidenceWithUrls = await Promise.all(
          evidenceRows.map(async (photo) => {
            const { data: signedUrlData, error: signedUrlError } =
              await supabase.storage
                .from("tmfp-files")
                .createSignedUrl(photo.file_path, 60 * 10);

            return {
              ...photo,
              signed_url:
                signedUrlError || !signedUrlData?.signedUrl
                  ? null
                  : signedUrlData.signedUrl,
            };
          })
        );

        if (!active) {
          return;
        }

        setPhotos(evidenceWithUrls);
      } else {
        setPhotos([]);
      }

      setLoading(false);
    }

    loadReinspection();

    return () => {
      active = false;
    };
  }, [reinspectionId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-sm text-zinc-400">
            Loading controlled reinspection record...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !reinspection) {
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
              Reinspection unavailable
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {errorMessage ??
                "This reinspection record could not be retrieved."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const reinspectionName =
    reinspection.legacy_reinspection_id ?? "Controlled Reinspection Record";

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
            ASERION / REINSPECTION
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {reinspectionName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                Controlled reinspection record linked to the NCR close-out
                workflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${resultClasses(
                  reinspection.result
                )}`}
              >
                Result: {displayValue(reinspection.result)}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
                {reinspection.completed ? "Completed" : "Not completed"}
              </span>

              {ncr && (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                    ncr.ncr_status
                  )}`}
                >
                  NCR: {displayValue(ncr.ncr_status)}
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Reinspection Control
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Recorded reinspection position
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailCard
              label="Reinspection Date"
              value={formatDate(reinspection.reinspection_date)}
            />
            <DetailCard
              label="Result"
              value={reinspection.result}
            />
            <DetailCard
              label="Completed"
              value={reinspection.completed ? "Yes" : "No"}
            />
            <DetailCard
              label="Reinspector"
              value={reinspection.reinspector_id}
            />
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Reinspection Comments
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {displayValue(reinspection.comments)}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              NCR Close-Out
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Linked non-conformance record
            </h2>
          </div>

          {ncr ? (
            <div className="rounded-2xl border border-white/10 bg-[#111113] p-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {ncr.legacy_ncr_id ?? "Controlled NCR"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {displayValue(ncr.defect_type)}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                    ncr.ncr_status
                  )}`}
                >
                  {displayValue(ncr.ncr_status)}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailCard
                  label="Raised Date"
                  value={formatDate(ncr.raised_date)}
                />
                <DetailCard
                  label="Target Date"
                  value={formatDate(ncr.target_date)}
                />
                <DetailCard
                  label="Closed Date"
                  value={formatDate(ncr.closed_date)}
                />
                <DetailCard
                  label="Reinspection Required"
                  value={
                    ncr.reinspection_required === null
                      ? "Not recorded"
                      : ncr.reinspection_required
                      ? "Yes"
                      : "No"
                  }
                />
                <DetailCard label="Severity" value={ncr.severity} />
                <DetailCard label="Priority" value={ncr.priority} />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Defect Description
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    {displayValue(ncr.defect_description)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Corrective Action
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    {displayValue(ncr.corrective_action)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Recorded Root Cause
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  {displayValue(ncr.root_cause)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-zinc-400">
                The linked NCR record is not available.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Source Inspection
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Original inspection record
            </h2>
          </div>

          {inspection ? (
            <button
              type="button"
              onClick={() => router.push(`/inspection/${inspection.id}`)}
              className="w-full rounded-2xl border border-white/10 bg-[#111113] p-6 text-left transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {inspection.legacy_inspection_id ??
                      "Controlled Inspection Record"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Inspection date: {formatDate(inspection.inspection_date)}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${resultClasses(
                    inspection.result
                  )}`}
                >
                  {displayValue(inspection.result)}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailCard
                  label="Inspection Status"
                  value={inspection.inspection_status}
                />
                <DetailCard
                  label="Compliance Status"
                  value={inspection.compliance_status}
                />
                <DetailCard
                  label="Sequence"
                  value={inspection.inspection_sequence}
                />
                <DetailCard
                  label="Current Inspection"
                  value={inspection.is_current ? "Yes" : "No"}
                />
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-400">
                {displayValue(inspection.comments)}
              </p>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                Open source inspection →
              </p>
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-zinc-400">
                No source inspection record is available through the linked
                NCR.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Reinspection Evidence
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Evidence explicitly linked to this reinspection
            </h2>
          </div>

          {photos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#111113] p-6">
              <p className="text-sm font-medium text-zinc-200">
                No reinspection-specific photo evidence recorded.
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                Evidence from the original installation or inspection is not
                reused here unless it is explicitly linked to this
                reinspection record.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#111113]"
                >
                  {photo.signed_url ? (
                    <img
                      src={photo.signed_url}
                      alt={
                        photo.caption ??
                        "Controlled reinspection evidence photograph"
                      }
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-black/30 px-6 text-center">
                      <p className="text-sm text-zinc-500">
                        Evidence record exists, but the private file is not
                        currently available for display.
                      </p>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {displayValue(photo.photo_stage)}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {photo.legacy_photo_id ?? "Controlled evidence"}
                      </p>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {displayValue(photo.caption)}
                    </p>

                    <div className="mt-4 space-y-1 text-xs text-zinc-600">
                      <p>Taken: {formatDateTime(photo.taken_at)}</p>
                      <p>Uploaded: {formatDateTime(photo.uploaded_at)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-white/10 pt-6">
          <p className="max-w-4xl text-xs leading-6 text-zinc-600">
            ASERION presents the controlled records and evidence available for
            this workflow stage. A recorded reinspection result or closed NCR
            is not, by itself, a declaration that an installation, fire
            compartment, building or wider fire strategy is compliant or safe.
            Technical and assurance decisions remain subject to the applicable
            controlled process and competent review.
          </p>
        </section>
      </div>
    </main>
  );
}