export default function Home() {
  const navigation = [
    "Dashboard",
    "CRM / Customers",
    "Projects",
    "Commercial",
    "Assurance",
    "Documents",
    "People & Competence",
    "Reports",
    "Administration",
  ];

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="w-72 border-r border-neutral-800 bg-[#0B0B0C] p-6">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#C51F2A]">
              TIME MATTERS FIRE PROTECTION
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              ASERION
            </h1>

            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Information Control & Assurance Infrastructure
            </p>
          </div>

          <nav className="space-y-1">
            {navigation.map((item, index) => (
              <button
                key={item}
                className={`w-full rounded-md px-4 py-3 text-left text-sm transition ${
                  index === 0
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN COCKPIT */}
        <section className="flex-1 p-8 lg:p-10">
          <header className="flex items-start justify-between border-b border-neutral-800 pb-7">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#C51F2A]">
                DIRECTOR COCKPIT
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                Operational Overview
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Current business, project and assurance position.
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-neutral-500">SYSTEM STATUS</p>
              <p className="mt-1 text-sm font-medium text-white">
                Development Environment
              </p>
            </div>
          </header>

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