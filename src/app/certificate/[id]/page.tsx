"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Certificate = {
  id: string;
  legacy_certificate_id: string | null;
  installation_id: string;
  certificate_number: string | null;
  certificate_type: string | null;
  issued_by_id: string | null;
  issue_date: string | null;
  status: string | null;
  file_path: string | null;
  notes: string | null;
  job_id: string;
  revision_number: number | null;
  supersedes_certificate_id: string | null;
  is_current: boolean | null;
  superseded_at: string | null;
};

type Installation = {
  id: string;
  legacy_installation_id: string | null;
  installation_status: string | null;
  installation_date: string | null;
  revision_number: number | null;
  is_current: boolean | null;
};

type Issuer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  active: boolean | null;
};

type EligibilityResult = {
  eligible: boolean;
  reasons: string[] | null;
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

function statusClasses(status: string | null) {
  const normalised = status?.trim().toLowerCase();

  if (normalised === "issued") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (
    normalised === "withdrawn" ||
    normalised === "cancelled" ||
    normalised === "superseded"
  ) {
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

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const certificateId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const [installation, setInstallation] =
    useState<Installation | null>(null);

  const [issuer, setIssuer] = useState<Issuer | null>(null);

  const [eligibility, setEligibility] =
    useState<EligibilityResult | null>(null);

  const [eligibilityAvailable, setEligibilityAvailable] =
    useState(true);

  const [artifactValid, setArtifactValid] =
    useState<boolean | null>(null);

  const [artifactValidationAvailable, setArtifactValidationAvailable] =
    useState(true);

  const [certificateUrl, setCertificateUrl] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCertificate() {
      if (!certificateId) {
        if (active) {
          setErrorMessage("Certificate record is unavailable.");
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
        data: certificateData,
        error: certificateError,
      } = await supabase
        .from("certificates")
        .select(
          "id, legacy_certificate_id, installation_id, certificate_number, certificate_type, issued_by_id, issue_date, status, file_path, notes, job_id, revision_number, supersedes_certificate_id, is_current, superseded_at"
        )
        .eq("id", certificateId)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (certificateError || !certificateData) {
        setErrorMessage(
          "This certificate record is unavailable or you do not have access to it."
        );
        setLoading(false);
        return;
      }

      const controlledCertificate =
        certificateData as Certificate;

      setCertificate(controlledCertificate);

      const {
        data: installationData,
        error: installationError,
      } = await supabase
        .from("installation_records")
        .select(
          "id, legacy_installation_id, installation_status, installation_date, revision_number, is_current"
        )
        .eq("id", controlledCertificate.installation_id)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (installationError) {
        setErrorMessage(
          "The certificate was loaded, but its source installation could not be retrieved."
        );
        setLoading(false);
        return;
      }

      const controlledInstallation =
        installationData as Installation | null;

      setInstallation(controlledInstallation);

      if (controlledCertificate.issued_by_id) {
        const {
          data: issuerData,
          error: issuerError,
        } = await supabase
          .from("operatives")
          .select(
            "id, first_name, last_name, role, active"
          )
          .eq("id", controlledCertificate.issued_by_id)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (!issuerError && issuerData) {
          setIssuer(issuerData as Issuer);
        } else {
          setIssuer(null);
        }
      }

      if (controlledInstallation?.id) {
        const {
          data: eligibilityData,
          error: eligibilityError,
        } = await supabase.rpc(
          "tmfp_certificate_eligibility",
          {
            p_installation_id: controlledInstallation.id,
          }
        );

        if (!active) {
          return;
        }

        if (eligibilityError) {
          setEligibilityAvailable(false);
          setEligibility(null);
        } else {
          const firstEligibility = Array.isArray(eligibilityData)
            ? eligibilityData[0]
            : eligibilityData;

          if (firstEligibility) {
            setEligibility({
              eligible: Boolean(firstEligibility.eligible),
              reasons: Array.isArray(firstEligibility.reasons)
                ? firstEligibility.reasons
                : [],
            });
          } else {
            setEligibility(null);
          }
        }
      }

      const {
        data: artifactData,
        error: artifactError,
      } = await supabase.rpc(
        "tmfp_certificate_artifact_valid",
        {
          p_certificate_id: controlledCertificate.id,
        }
      );

      if (!active) {
        return;
      }

      if (artifactError) {
        setArtifactValidationAvailable(false);
        setArtifactValid(null);
      } else {
        setArtifactValid(Boolean(artifactData));
      }

      if (controlledCertificate.file_path) {
        const {
          data: signedUrlData,
          error: signedUrlError,
        } = await supabase.storage
          .from("tmfp-files")
          .createSignedUrl(
            controlledCertificate.file_path,
            60 * 10
          );

        if (!active) {
          return;
        }

        if (
          !signedUrlError &&
          signedUrlData?.signedUrl
        ) {
          setCertificateUrl(signedUrlData.signedUrl);
        } else {
          setCertificateUrl(null);
        }
      }

      setLoading(false);
    }

    loadCertificate();

    return () => {
      active = false;
    };
  }, [certificateId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-sm text-zinc-400">
            Loading controlled certificate record...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !certificate) {
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
              Certificate unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {errorMessage ??
                "This certificate record could not be retrieved."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const certificateName =
    certificate.certificate_number ??
    certificate.legacy_certificate_id ??
    "Controlled Certificate Record";

  const issuerName = issuer
    ? `${issuer.first_name ?? ""} ${
        issuer.last_name ?? ""
      }`.trim()
    : "";

  const eligibilityReasons =
    eligibility?.reasons ?? [];

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
            ASERION / CERTIFICATE
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {certificateName}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                Controlled certificate record, certification
                eligibility position and private certificate
                artefact.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                  certificate.status
                )}`}
              >
                {displayValue(certificate.status)}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
                Revision{" "}
                {displayValue(certificate.revision_number)}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
                {certificate.is_current
                  ? "Current record"
                  : "Historical record"}
              </span>
            </div>
          </div>
        </header>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Certificate Control
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Recorded certificate position
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailCard
              label="Certificate Number"
              value={certificate.certificate_number}
            />

            <DetailCard
              label="Certificate Type"
              value={certificate.certificate_type}
            />

            <DetailCard
              label="Issue Date"
              value={formatDate(certificate.issue_date)}
            />

            <DetailCard
              label="Status"
              value={certificate.status}
            />

            <DetailCard
              label="Revision"
              value={certificate.revision_number}
            />

            <DetailCard
              label="Current Record"
              value={certificate.is_current ? "Yes" : "No"}
            />

            <DetailCard
              label="Supersedes Certificate"
              value={certificate.supersedes_certificate_id}
            />

            <DetailCard
              label="Superseded At"
              value={certificate.superseded_at}
            />
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Certificate Notes
            </p>

            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {displayValue(certificate.notes)}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Issued By
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Recorded issuer
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111113] p-6">
            {issuer ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailCard
                  label="Name"
                  value={
                    issuerName || "Not recorded"
                  }
                />

                <DetailCard
                  label="Role"
                  value={issuer.role}
                />

                <DetailCard
                  label="Operative Status"
                  value={
                    issuer.active ? "Active" : "Inactive"
                  }
                />

                <DetailCard
                  label="Operative ID"
                  value={issuer.id}
                />
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Issuer details are not available.
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  The certificate remains visible through the
                  controlled job-access policy. Operative details
                  are displayed only when the current user is
                  permitted to read them.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Source Installation
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Installation linked to this certificate
            </h2>
          </div>

          {installation ? (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/installation/${installation.id}`
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-[#111113] p-6 text-left transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {installation.legacy_installation_id ??
                      "Controlled Installation Record"}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Installation date:{" "}
                    {formatDate(
                      installation.installation_date
                    )}
                  </p>
                </div>

                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
                  {displayValue(
                    installation.installation_status
                  )}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailCard
                  label="Status"
                  value={
                    installation.installation_status
                  }
                />

                <DetailCard
                  label="Revision"
                  value={installation.revision_number}
                />

                <DetailCard
                  label="Current Installation"
                  value={
                    installation.is_current ? "Yes" : "No"
                  }
                />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                Open source installation →
              </p>
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-zinc-400">
                The linked installation record is not
                available.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Certification Eligibility
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Current V5 eligibility decision
            </h2>
          </div>

          {!eligibilityAvailable ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <p className="text-sm font-semibold text-amber-300">
                Eligibility decision unavailable
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                The certificate record is available, but the
                controlled eligibility engine could not be
                executed in this session.
              </p>
            </div>
          ) : eligibility ? (
            <div
              className={`rounded-2xl border p-6 ${
                eligibility.eligible
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Eligibility
                  </p>

                  <p
                    className={`mt-2 text-xl font-semibold ${
                      eligibility.eligible
                        ? "text-emerald-300"
                        : "text-red-300"
                    }`}
                  >
                    {eligibility.eligible
                      ? "ELIGIBLE"
                      : "NOT ELIGIBLE"}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                    eligibility.eligible
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {eligibilityReasons.length} blocking{" "}
                  {eligibilityReasons.length === 1
                    ? "reason"
                    : "reasons"}
                </span>
              </div>

              {eligibilityReasons.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {eligibilityReasons.map(
                    (reason, index) => (
                      <div
                        key={`${reason}-${index}`}
                        className="rounded-xl border border-red-500/10 bg-black/20 p-4"
                      >
                        <p className="text-sm leading-6 text-zinc-300">
                          {reason}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  The controlled eligibility engine returned no
                  blocking reasons for this installation.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-zinc-400">
                No eligibility decision was returned.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Certificate Artefact
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Private controlled document
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111113] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {certificate.certificate_number ??
                    certificate.legacy_certificate_id ??
                    "Certificate artefact"}
                </p>

                {!artifactValidationAvailable ? (
                  <p className="mt-2 text-sm text-amber-300">
                    Artefact validation is unavailable in this
                    session.
                  </p>
                ) : artifactValid ? (
                  <p className="mt-2 text-sm text-emerald-300">
                    V5 artefact validation: VALID
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-red-300">
                    V5 artefact validation: NOT VALID
                  </p>
                )}

                <p className="mt-3 max-w-3xl break-all text-xs leading-6 text-zinc-600">
                  {displayValue(certificate.file_path)}
                </p>
              </div>

              {certificateUrl ? (
                <a
                  href={certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Open certificate PDF
                </a>
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-500">
                  Private artefact unavailable
                </div>
              )}
            </div>

            <p className="mt-5 text-xs leading-6 text-zinc-600">
              The document link uses a temporary signed URL from
              the private TMFP file store. The Storage bucket is
              not made public by this view.
            </p>
          </div>
        </section>

        <section className="mt-10 border-t border-white/10 pt-6">
          <p className="max-w-4xl text-xs leading-6 text-zinc-600">
            ASERION presents the controlled certificate record,
            the current output of the V5 certificate eligibility
            engine and the recorded certificate artefact. An
            issued certificate or an ELIGIBLE result is not, by
            itself, a declaration that a building, compartment,
            installation or wider fire strategy is compliant or
            safe. Technical and assurance decisions remain
            subject to the applicable controlled process and
            competent review.
          </p>
        </section>
      </div>
    </main>
  );
}