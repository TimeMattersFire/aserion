import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/dashboard/DashboardHeader";
export default function Home() {
  
  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="flex min-h-screen">

       <Sidebar />

        {/* MAIN COCKPIT */}
        <section className="flex-1 p-8 lg:p-10">
          <DashboardHeader />

          {/* ATTENTION */}
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide">
                ATTENTION REQUIRED
              </h3>

              <span className="text-xs text-neutral-500">
                Operational exceptions
              </span>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6">
              <p className="text-sm text-neutral-400">
                No live operational data connected.
              </p>

              <p className="mt-2 text-xs text-neutral-600">
                Alerts, approvals, NCRs, expiring competence and commercial
                actions will appear here.
              </p>
            </div>
          </section>

          {/* KPI GRID */}
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

          {/* LOWER GRID */}
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

          {/* QUICK ACTIONS */}
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
        </section>
      </div>
    </main>
  );
}