export default function LowerGrid() {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-2">
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6">
        <h3 className="text-sm font-semibold">LIVE PROJECTS</h3>

        <p className="mt-6 text-sm text-neutral-500">
          Project controls will appear here.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6">
        <h3 className="text-sm font-semibold">RECENT ACTIVITY</h3>

        <p className="mt-6 text-sm text-neutral-500">
          Controlled system activity will appear here.
        </p>
      </div>
    </section>
  );
}