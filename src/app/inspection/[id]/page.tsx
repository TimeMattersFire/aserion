"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Inspection = {
  id: string;
  legacy_inspection_id: string | null;
  installation_id: string;
  inspector_id: string | null;
  inspection_date: string | null;
  inspection_status: string | null;
  compliance_status: string | null;
  result: string | null;
  comments: string | null;
  inspection_sequence: number | null;
  inspection_slot: number | null;
  supersedes_inspection_id: string | null;
  is_current: boolean | null;
};

type Installation = {
  id: string;
  legacy_installation_id: string | null;
  installation_status: string | null;
  revision_number: number | null;
};

type Ncr = {
  id: string;
  legacy_ncr_id: string | null;
  defect_type: string | null;
  defect_description: string | null;
  severity: string | null;
  priority: string | null;
  corrective_action: string | null;
  ncr_status: string | null;
  raised_date: string | null;
  target_date: string | null;
  closed_date: string | null;
  reinspection_required: boolean | null;
};

type InspectionPhoto = {
  id: string;
  photo_stage: string | null;
  file_path: string;
  caption: string | null;
  taken_at: string | null;
  uploaded_at: string | null;
  signed_url: string | null;
};

function displayValue(
  value: string | number | boolean | null | undefined
) {
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function resultClasses(result: string | null) {
  const normalized = result?.trim().toLowerCase();

  if (normalized === "pass") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized === "fail") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

export default function InspectionPage() {
  const params = useParams();
  const router = useRouter();

  const inspectionId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [installation, setInstallation] =
    useState<Installation | null>(null);
  const [ncrs, setNcrs] = useState<Ncr[]>([]);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInspection() {
      if (!inspectionId) {
        setErrorMessage("Inspection reference is unavailable.");
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const {
        data: inspectionData,
        error: inspectionError,
      } = await supabase
        .from("inspections")
        .select(
          [
            "id",
            "legacy_inspection_id",
            "installation_id",
            "inspector_id",
            "inspection_date",
            "inspection_status",
            "compliance_status",
            "result",
            "comments",
            "inspection_sequence",
            "inspection_slot",
            "supersedes_inspection_id",
            "is_current",
          ].join(",")
        )
        .eq("id", inspectionId)
        .maybeSingle();

      if (inspectionError || !inspectionData) {
        setErrorMessage(
          "This inspection is unavailable or you do not have access to it."
        );
        setLoading(false);
        return;
      }

      const typedInspection = inspectionData as Inspection;
      setInspection(typedInspection);

      if (typedInspection.installation_id) {
        const {
          data: installationData,
          error: installationError,
        } = await supabase
          .from("installation_records")
          .select(
            "id, legacy_installation_id, installation_status, revision_number"
          )
          .eq("id", typedInspection.installation_id)
          .maybeSingle();

        if (!installationError && installationData) {
          setInstallation(installationData as Installation);
        }
      }

      const { data: ncrData, error: ncrError } = await supabase
        .from("defects_ncr")
        .select(
          [
            "id",
            "legacy_ncr_id",
            "defect_type",
            "defect_description",
            "severity",
            "priority",
            "corrective_action",
            "ncr_status",
            "raised_date",
            "target_date",
            "closed_date",
            "reinspection_required",
          ].join(",")
        )
        .eq("inspection_id", inspectionId)
        .order("raised_date", { ascending: true });

      if (!ncrError && ncrData) {
        setNcrs(ncrData as Ncr[]);
      }

      const {
        data: photoData,
        error: photoError,
      } = await supabase
        .from("photo_evidence")
        .select(
          "id, photo_stage, file_path, caption, taken_at, uploaded_at"
        )
        .eq("inspection_id", inspectionId)
        .order("taken_at", { ascending: true });

      if (!photoError && photoData) {
        const signedPhotos = await Promise.all(
          photoData.map(async (photo) => {
            const { data: signedData, error: signedError } =
              await supabase.storage
                .from("tmfp-files")
                .createSignedUrl(photo.file_path, 60 * 10);

            return {
              ...photo,
              signed_url:
                signedError || !signedData
                  ? null
                  : signedData.signedUrl,
            } as InspectionPhoto;
          })
        );

        setPhotos(signedPhotos);
      }

      setLoading(false);
    }

    loadInspection();
  }, [inspectionId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0b0c] text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm text-zinc-400">
            Loading controlled inspection record...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !inspection) {
    return (
      <main className="min-h-screen bg-[#0b0b0c] text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
            ASERION / Inspection
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            Inspection unavailable
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            {errorMessage ??
              "This inspection record could not be loaded."}
          </p>
        </div>
      </main>
    );
  }

  const openNcrCount = ncrs.filter((ncr) => {
    const status = ncr.ncr_status?.trim().toLowerCase();
    return status !== "closed" && status !== "resolved";
  }).length;

  return (
    <main className="min-h-screen bg-[#0b0b0c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/installation/${inspection.installation_id}`
            )
          }
          className="mb-8 text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back to Installation
        </button>

        <section className="border-b border-white/10 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
            ASERION / Inspection
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {inspection.legacy_inspection_id ??
                  "Controlled Inspection Record"}
              </h1>

              <p className="mt-3 max-w-3xl text-zinc-400">
                Controlled inspection information linked to the
                installation record. Inspection result, compliance
                status and NCR position are presented as separate
                recorded facts.
              </p>
            </div>

            <div
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${resultClasses(
                inspection.result
              )}`}
            >
              Result: {displayValue(inspection.result)}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Inspection Status
            </p>
            <p className="mt-3 text-lg font-semibold">
              {displayValue(inspection.inspection_status)}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Compliance Status
            </p>
            <p className="mt-3 text-lg font-semibold">
              {displayValue(inspection.compliance_status)}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Inspection Date
            </p>
            <p className="mt-3 text-lg font-semibold">
              {formatDate(inspection.inspection_date)}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Current Record
            </p>
            <p className="mt-3 text-lg font-semibold">
              {inspection.is_current ? "Yes" : "No"}
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
              Inspection Control
            </p>

            <div className="mt-6 space-y-5">
              <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4">
                <span className="text-sm text-zinc-500">
                  Inspection sequence
                </span>
                <span className="text-right text-sm font-medium">
                  {displayValue(inspection.inspection_sequence)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4">
                <span className="text-sm text-zinc-500">
                  Inspection slot
                </span>
                <span className="text-right text-sm font-medium">
                  {displayValue(inspection.inspection_slot)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4">
                <span className="text-sm text-zinc-500">
                  Inspector reference
                </span>
                <span className="max-w-[60%] break-all text-right text-sm font-medium">
                  {displayValue(inspection.inspector_id)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-6">
                <span className="text-sm text-zinc-500">
                  Supersedes inspection
                </span>
                <span className="max-w-[60%] break-all text-right text-sm font-medium">
                  {displayValue(
                    inspection.supersedes_inspection_id
                  )}
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
              Inspection Assessment
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                  Recorded result
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {displayValue(inspection.result)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                  Recorded compliance status
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {displayValue(inspection.compliance_status)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                  Inspector comments
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {displayValue(inspection.comments)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs leading-5 text-zinc-500">
                ASERION presents the controlled inspection record.
                A recorded inspection result is not converted into a
                broader building-safety or compliance determination.
              </p>
            </div>
          </article>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                Source Installation
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Installation record
              </h2>
            </div>
          </div>

          {installation ? (
            <button
              type="button"
              onClick={() =>
                router.push(`/installation/${installation.id}`)
              }
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {installation.legacy_installation_id ??
                      "Installation Record"}
                  </p>

                  <p className="mt-2 text-sm text-zinc-400">
                    Status:{" "}
                    {displayValue(
                      installation.installation_status
                    )}
                    {" · "}
                    Revision:{" "}
                    {displayValue(installation.revision_number)}
                  </p>
                </div>

                <span className="text-sm font-medium text-red-400">
                  Open installation →
                </span>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-zinc-400">
                The linked installation record is unavailable to
                this session.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                NCR / Defect Control
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Inspection NCR position
              </h2>
            </div>

            <div className="text-sm text-zinc-400">
              {ncrs.length} recorded · {openNcrCount} open
            </div>
          </div>

          {ncrs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-medium">
                No NCRs recorded against this inspection.
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                This means no NCR record is linked to this inspection
                in the controlled dataset. It does not independently
                establish compliance beyond the recorded inspection
                information.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ncrs.map((ncr) => (
                <article
                  key={ncr.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold">
                        {ncr.legacy_ncr_id ?? "Controlled NCR"}
                      </p>

                      <p className="mt-2 text-sm text-zinc-400">
                        {displayValue(ncr.defect_type)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                        {displayValue(ncr.ncr_status)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                        Severity: {displayValue(ncr.severity)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                        Priority: {displayValue(ncr.priority)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                        Defect description
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {displayValue(ncr.defect_description)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                        Corrective action
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {displayValue(ncr.corrective_action)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Raised
                      </p>
                      <p className="mt-1 text-sm">
                        {formatDate(ncr.raised_date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Target
                      </p>
                      <p className="mt-1 text-sm">
                        {formatDate(ncr.target_date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Closed
                      </p>
                      <p className="mt-1 text-sm">
                        {formatDate(ncr.closed_date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Reinspection required
                      </p>
                      <p className="mt-1 text-sm">
                        {displayValue(ncr.reinspection_required)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 pb-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
              Inspection Evidence
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Inspection-specific photo evidence
            </h2>
          </div>

          {photos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-medium">
                No inspection-specific photo evidence recorded.
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Installation Before, During and After photographs are
                not reused here as inspection evidence unless they are
                explicitly linked to the inspection record.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <div className="aspect-[4/3] bg-black/30">
                    {photo.signed_url ? (
                      <img
                        src={photo.signed_url}
                        alt={
                          photo.caption ??
                          "Controlled inspection evidence"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-500">
                        Evidence file unavailable to this session.
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-red-400">
                      {displayValue(photo.photo_stage)}
                    </p>

                    <p className="mt-3 text-sm text-zinc-300">
                      {displayValue(photo.caption)}
                    </p>

                    <div className="mt-4 space-y-1 text-xs text-zinc-500">
                      <p>Taken: {formatDateTime(photo.taken_at)}</p>
                      <p>
                        Uploaded:{" "}
                        {formatDateTime(photo.uploaded_at)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-white/10 py-6">
          <p className="max-w-4xl text-xs leading-5 text-zinc-600">
            Controlled demonstration data may be displayed within this
            development environment. ASERION records and presents
            controlled information and assurance evidence; competent
            persons remain responsible for technical and operational
            decisions.
          </p>
        </div>
      </div>
    </main>
  );
}