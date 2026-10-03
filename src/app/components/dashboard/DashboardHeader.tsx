export default function DashboardHeader() {
  return (
    <header className="flex items-start justify-between border-b border-neutral-800 pb-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.22em] text-red-600">
          DIRECTOR COCKPIT
        </p>

        <h1 className="mt-3 text-5xl font-semibold tracking-tight">
          Operational Overview
        </h1>

        <p className="mt-3 text-lg text-neutral-500">
          Current business, project and assurance position.
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm text-neutral-500">SYSTEM STATUS</p>
        <p className="mt-2 text-lg text-white">Development Environment</p>
      </div>
    </header>
  );
}