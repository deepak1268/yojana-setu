const partners = [
  { name: "State Channelising Agency", city: "Your district HQ", tag: "SCA", status: "Eligible" },
  { name: "Public Sector Bank branch", city: "2.4 km", tag: "PSB", status: "Utilisation OK" },
  { name: "Regional Rural Bank", city: "6.1 km", tag: "RRB", status: "Eligible" },
  { name: "NBFC-MFI (micro only)", city: "1.1 km", tag: "MFI", status: "Micro finance" },
];

export function PartnerPreview() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
      <div className="grid overflow-hidden rounded-3xl border border-navy/10 bg-card lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-72 bg-navy p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-saffron uppercase">
            Geo-spatial locator
          </p>
          <h3 className="mt-2 font-display text-2xl text-cream">
            Nearest partner that can still process your category
          </h3>
          <svg
            viewBox="0 0 480 260"
            className="mt-6 h-auto w-full"
            aria-hidden
          >
            <path
              d="M40 180 C80 80 140 50 220 90 C280 120 300 40 380 70 C430 90 450 150 420 200 C380 250 200 240 40 180Z"
              fill="#1a3a55"
              stroke="#E36A1A"
              strokeWidth="1.5"
              opacity="0.9"
            />
            <circle cx="160" cy="120" r="8" fill="#E36A1A" />
            <circle cx="280" cy="95" r="6" fill="#f6f1e8" />
            <circle cx="340" cy="150" r="6" fill="#f6f1e8" />
            <circle cx="210" cy="175" r="6" fill="#3d9b6a" />
            <path d="M160 120 L160 100" stroke="#E36A1A" strokeWidth="2" />
            <rect x="128" y="72" width="64" height="24" rx="6" fill="#fbf7f0" />
            <text x="160" y="88" textAnchor="middle" fontSize="10" fill="#122033">
              You
            </text>
          </svg>
        </div>
        <ul className="divide-y divide-navy/10">
          {partners.map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-3 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.tag} · {p.city}
                </p>
              </div>
              <span className="rounded-full bg-green/10 px-2.5 py-1 text-[11px] font-semibold text-green">
                {p.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
