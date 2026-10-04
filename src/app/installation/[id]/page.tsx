"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Installation = {
  id: string;
  legacy_installation_id: string | null;
  sow_id: string | null;
  installer_id: string | null;
  system_id: string | null;
  system_configuration_id: string | null;
  installation_date: string | null;
  installation_status: string | null;
  deviation_from_survey: string | null;
  notes: string | null;
  revision_number: number | null;
  is_current: boolean | null;
};

type ScopeOfWorks = {
  id: string;
  legacy_sow_id: string | null;
  status: string | null;
  revision_number: number | null;
};

type Inspection = {
  id: string;
  legacy_inspection_id: string | null;
  inspection_date: string | null;
  inspection_status: string | null;
  compliance_status: string | null;
  result: string | null;
  inspection_sequence: number | null;
  inspection_slot: number | null;
  is_current: boolean | null;
};

type PhotoEvidence = {
  photo_evidence_id: string;
  job_id: string;
  location_id: string | null;
  installation_id: string;
  photo_stage: string;
  file_path: string;
  caption: string | null;
  taken_at: string | null;
  uploaded_at: string | null;
  signed_url?: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resultClasses(result: string | null) {
  const normalized = result?.trim().toLowerCase();

  if (normalized === "pass") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized === "fail") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-white/10 bg-white/5 text-white/70";
}

export default function InstallationPage() {
  const params = useParams();
  const router = useRouter();

  const installationId = params.id as string;

  const [installation, setInstallation] =
    useState<Installation | null>(null);

  const [sow, setSow] = useState<ScopeOfWorks | null>(null);

  const [inspections, setInspections] = useState<Inspection[]>([]);

  const [photoEvidence, setPhotoEvidence] = useState<
    PhotoEvidence[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInstallation() {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const {
        data: installationData,
        error: installationError,
      } = await supabase
        .from("installation_records")
        .select(
          `
          id,
          legacy_installation_id,
          sow_id,
          installer_id,
          system_id,
          system_configuration_id,
          installation_date,
          installation_status,
          deviation_from_survey,
          notes,
          revision_number,
          is_current
        `
        )
        .eq("id", installationId)
        .maybeSingle();

      if (installationError) {
        setError(installationError.message);
        setLoading(false);
        return;
      }

      if (!installationData) {
        setError(
          "Installation not found or you do not have access to this record."
        );
        setLoading(false);
        return;
      }

      setInstallation(installationData);

      if (installationData.sow_id) {
        const { data: sowData, error: sowError } = await supabase
          .from("scope_of_works")
          .select(
            `
            id,
            legacy_sow_id,
            status,
            revision_number
          `
          )
          .eq("id", installationData.sow_id)
          .maybeSingle();

        if (sowError) {
          setError(sowError.message);
          setLoading(false);
          return;
        }

        setSow(sowData);
      }

      const {
        data: inspectionData,
        error: inspectionError,
      } = await supabase
        .from("inspections")
        .select(
          `
          id,
          legacy_inspection_id,
          inspection_date,
          inspection_status,
          compliance_status,
          result,
          inspection_sequence,
          inspection_slot,
          is_current
        `
        )
        .eq("installation_id", installationData.id)
        .order("inspection_sequence", { ascending: true });

      if (inspectionError) {
        setError(inspectionError.message);
        setLoading(false);
        return;
      }

      setInspections((inspectionData ?? []) as Inspection[]);

      const {
        data: evidenceData,
        error: evidenceError,
      } = await supabase.rpc("tmfp_installation_photo_evidence", {
        p_installation_id: installationData.id,
      });

      if (evidenceError) {
        setError(evidenceError.message);
        setLoading(false);
        return;
      }

      const evidence = (evidenceData ?? []) as PhotoEvidence[];

      const evidenceWithUrls = await Promise.all(
        evidence.map(async (photo) => {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("tmfp-files")
              .createSignedUrl(photo.file_path, 60 * 10);

          return {
            ...photo,
            signed_url: signedError
              ? null
              : signedData?.signedUrl ?? null,
          };
        })
      );

      setPhotoEvidence(evidenceWithUrls);
      setLoading(false);
    }

    loadInstallation();
  }, [installationId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0B0C] p-8 text-white">
        <p className="text-sm text-white/60">
          Loading installation record...
        </p>
      </main>
    );
  }

  if (error || !installation) {
    return (
      <main className="min-h-screen bg-[#0B0B0C] p-8 text-white">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => router.back()}
            className="mb-8 text-sm text-white/60 hover:text-white"
          >
            ← Back
          </button>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="font-semibold text-red-300">
              Installation unavailable
            </p>

            <p className="mt-2 text-sm text-red-200/70">
              {error ??
                "The installation record could not be loaded."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const stages = ["Before", "During", "After"];

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <button
          onClick={() =>
            sow ? router.push(`/sow/${sow.id}`) : router.back()
          }
          className="mb-10 text-sm text-white/60 transition hover:text-white"
        >
          ← Back to Scope of Works
        </button>

        <div className="mb-10 border-b border-white/10 pb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-red-400">
            ASERION / INSTALLATION
          </p>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {installation.legacy_installation_id ??
                  "Installation Record"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                {installation.notes ??
                  "Controlled installation record."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
                {installation.installation_status ?? "No status"}
              </span>

              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
                Revision {installation.revision_number ?? "—"}
              </span>

              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
                {installation.is_current
                  ? "Current record"
                  : "Historical record"}
              </span>
            </div>
          </div>
        </div>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Installation Control
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Controlled information recorded against this
              installation.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Installation Status"
              value={
                installation.installation_status ?? "Not recorded"
              }
            />

            <InfoCard
              label="Installation Date"
              value={formatDate(installation.installation_date)}
            />

            <InfoCard
              label="Deviation from Survey"
              value={
                installation.deviation_from_survey ??
                "Not recorded"
              }
            />

            <InfoCard
              label="Record Position"
              value={
                installation.is_current
                  ? "Current record"
                  : "Historical record"
              }
            />
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Source Scope of Works
            </h2>

            <p className="mt-1 text-sm text-white/50">
              The controlled scope record linked to this
              installation.
            </p>
          </div>

          {sow ? (
            <button
              onClick={() => router.push(`/sow/${sow.id}`)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Scope of Works
                  </p>

                  <p className="mt-2 font-semibold">
                    {sow.legacy_sow_id ?? "SOW record"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {sow.status ?? "No status"}
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    Revision {sow.revision_number ?? "—"}
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-white/50">
                No accessible Scope of Works record is linked.
              </p>
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Inspection Records
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/50">
              Inspection records directly linked to this controlled
              installation. ASERION does not infer inspections from
              another job, location or workflow record.
            </p>
          </div>

          {inspections.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-medium">
                No Inspection record is linked to this Installation.
              </p>

              <p className="mt-2 text-sm leading-6 text-white/50">
                An inspection must reference this installation
                directly before it is presented here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inspections.map((inspection) => (
                <button
                  key={inspection.id}
                  type="button"
                  onClick={() =>
                    router.push(`/inspection/${inspection.id}`)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Inspection Reference
                      </p>

                      <p className="mt-2 text-lg font-semibold">
                        {inspection.legacy_inspection_id ??
                          "Inspection Record"}
                      </p>

                      <p className="mt-2 text-sm text-white/50">
                        Inspection date:{" "}
                        {formatDate(inspection.inspection_date)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${resultClasses(
                          inspection.result
                        )}`}
                      >
                        Result: {inspection.result ?? "Not recorded"}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                        {inspection.inspection_status ??
                          "No status"}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                        {inspection.is_current
                          ? "Current record"
                          : "Historical record"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                        Sequence
                      </p>

                      <p className="mt-2 text-sm text-white/80">
                        {inspection.inspection_sequence ??
                          "Not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                        Slot
                      </p>

                      <p className="mt-2 text-sm text-white/80">
                        {inspection.inspection_slot ??
                          "Not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                        Compliance Status
                      </p>

                      <p className="mt-2 text-sm text-white/80">
                        {inspection.compliance_status ??
                          "Not recorded"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm font-medium text-red-400">
                    Open controlled Inspection →
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Installation Evidence
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/50">
              Evidence records are retrieved through the controlled
              installation evidence function. Private files are
              requested through temporary Storage URLs and remain
              subject to job-access controls.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {stages.map((stage) => {
              const photos = photoEvidence.filter(
                (photo) =>
                  photo.photo_stage.toLowerCase() ===
                  stage.toLowerCase()
              );

              return (
                <div
                  key={stage}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{stage}</h3>

                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
                        {photos.length}{" "}
                        {photos.length === 1
                          ? "record"
                          : "records"}
                      </span>
                    </div>
                  </div>

                  {photos.length === 0 ? (
                    <div className="p-5">
                      <p className="text-sm text-white/40">
                        No {stage.toLowerCase()} evidence recorded.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5 p-5">
                      {photos.map((photo) => (
                        <div key={photo.photo_evidence_id}>
                          {photo.signed_url ? (
                            <img
                              src={photo.signed_url}
                              alt={`${stage} installation evidence`}
                              className="aspect-[4/3] w-full rounded-xl border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 px-5 text-center">
                              <p className="text-xs leading-5 text-white/40">
                                Private evidence file is not
                                accessible through the current
                                Storage policy.
                              </p>
                            </div>
                          )}

                          <p className="mt-4 text-sm leading-6 text-white/70">
                            {photo.caption ??
                              "No evidence caption recorded."}
                          </p>

                          <div className="mt-3 space-y-1 text-xs text-white/40">
                            <p>
                              Taken:{" "}
                              {formatDateTime(photo.taken_at)}
                            </p>

                            <p>
                              Uploaded:{" "}
                              {formatDateTime(photo.uploaded_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            Controlled Demonstration Data
          </p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-100/70">
            Demonstration records and evidence are used to test
            ASERION information-control workflows. Their presence
            does not independently establish technical compliance,
            installation conformity or building safety.
          </p>
        </section>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>

      <p className="mt-3 text-sm font-semibold text-white/90">
        {value}
      </p>
    </div>
  );
}