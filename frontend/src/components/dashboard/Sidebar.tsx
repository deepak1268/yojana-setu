"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/recommender", label: "Scheme recommender", icon: "compass" },
  { href: "/dashboard/calculator", label: "EMI calculator", icon: "calc" },
  { href: "/dashboard/locator", label: "Partner locator", icon: "pin" },
] as const;

function Icon({ name }: { name: (typeof links)[number]["icon"] }) {
  const common = { viewBox: "0 0 24 24", className: "h-[18px] w-[18px]", fill: "none" as const };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "calc":
      return (
        <svg {...common}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 8h8M8 12h2m3 0h2M8 16h2m3 0h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
  }
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-navy text-cream lg:flex">
      <div className="tricolor-bar h-1 w-full" />
      <Link href="/" className="flex items-center gap-2.5 px-6 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-saffron text-sm font-semibold text-white shadow-sm">
          YS
        </span>
        <span>
          <span className="block font-display text-lg leading-none">Yojana Setu</span>
          <span className="text-[11px] tracking-wide text-cream/50">योजना सेतु</span>
        </span>
      </Link>

      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-cream text-ink"
                  : "text-cream/70 hover:bg-white/8 hover:text-cream"
              }`}
            >
              <Icon name={link.icon} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold text-saffron">Prototype build</p>
        <p className="mt-1 text-xs leading-relaxed text-cream/60">
          Verify eligibility and rates with your channel partner before applying.
        </p>
      </div>
    </aside>
  );
}
