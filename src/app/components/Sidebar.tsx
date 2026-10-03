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

export default function Sidebar() {
  return (
    <aside className="w-72 shrink-0 border-r border-neutral-800 bg-[#0B0B0C] p-6">
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
  );
}