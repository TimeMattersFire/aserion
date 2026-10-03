export default function QuickActions() {
  return (
    <section className="mt-8">
      <h3 className="mb-4 text-sm font-semibold">QUICK ACTIONS</h3>

      <div className="flex flex-wrap gap-3">
        {[
          "New Enquiry",
          "New Customer",
          "New Project",
          "Create Quote",
          "Record Inspection",
        ].map((action) => (
          <button
            key={action}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-white"
          >
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}