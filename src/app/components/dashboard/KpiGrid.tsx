export default function KpiGrid() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[
        ["BUSINESS PIPELINE", "—", "Open opportunities"],
        ["COMMERCIAL", "—", "Current position"],
        ["ASSURANCE", "—", "Locations requiring action"],
        ["LIVE PROJECTS", "—", "Active projects"],
      ].map(([label, value, description]) => (
        <div
          key={label}
          className="rounded-lg border border-neutral-800 bg-neutral-950 p-5"
        >
          <p className="text-xs font-medium tracking-wide text-neutral-500">
            {label}
          </p>

          <p className="mt-4 text-3xl font-semibold">{value}</p>

          <p className="mt-2 text-xs text-neutral-600">{description}</p>
        </div>
      ))}
    </section>
  );
}