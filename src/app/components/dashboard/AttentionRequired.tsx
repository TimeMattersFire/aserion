export default function AttentionRequired() {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">
          ATTENTION REQUIRED
        </h3>

        <span className="text-xs text-neutral-500">
          Operational exceptions
        </span>
      </div>

      <div className="rounded-lg border border-neutral-800 p-6">
        <p className="text-sm text-neutral-300">
          No live operational data connected.
        </p>

        <p className="mt-2 text-xs text-neutral-600">
          Alerts, approvals, NCRs, expiring competence and commercial actions
          will appear here.
        </p>
      </div>
    </section>
  );
}