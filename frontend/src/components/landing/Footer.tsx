import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-[#072439] text-white">
      {/* Background illustration silhouette at bottom left */}
      <div className="pointer-events-none absolute bottom-10 left-0 h-24 w-64 sm:h-28 sm:w-72 select-none opacity-60">
        <Image
          src="/footer-building-silhouette-smooth.png"
          alt=""
          fill
          className="object-contain object-bottom-left"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-8 pb-5 sm:px-8 sm:pt-9 sm:pb-6">
        <div className="grid grid-cols-1 items-center gap-7 md:grid-cols-12 lg:gap-8">
          {/* Left Column: Brand & Value Prop */}
          <div className="md:col-span-12 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Yojana Setu Logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg bg-white p-1 object-contain shadow-xs"
              />
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                  Yojana Setu
                </h3>
                <p className="text-[11px] text-slate-300">
                  Find government schemes that fit your needs.
                </p>
              </div>
            </div>

            {/* 3 Feature Pills */}
            <div className="mt-4 flex flex-wrap items-start gap-4 sm:gap-6">
              {/* Feature 1 */}
              <div className="flex max-w-[75px] flex-col items-center text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#f6c343] shadow-xs">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" stroke="none">
                    <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
                    <circle cx="5" cy="5" r="1" />
                    <circle cx="19" cy="5" r="1" />
                    <circle cx="5" cy="19" r="1" />
                    <circle cx="19" cy="19" r="1" />
                  </svg>
                </div>
                <span className="mt-1.5 text-[10px] font-medium leading-tight text-slate-300">
                  AI-powered matching
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex max-w-[85px] flex-col items-center text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#70c7e2] shadow-xs">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="8" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                </div>
                <span className="mt-1.5 text-[10px] font-medium leading-tight text-slate-300">
                  Personalized recommendations
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex max-w-[80px] flex-col items-center text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#70c7e2] shadow-xs">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="mt-1.5 text-[10px] font-medium leading-tight text-slate-300">
                  Support for entrepreneurs
                </span>
              </div>
            </div>
          </div>

          {/* Middle Column: Explore */}
          <div className="md:col-span-4 lg:col-span-3 lg:pl-4">
            <h4 className="text-sm font-semibold tracking-wide text-white">Explore</h4>
            <ul className="mt-3 space-y-2.5 text-xs font-medium">
              <li>
                <Link
                  href="/dashboard/recommender"
                  className="group flex items-center gap-2.5 text-slate-300 transition hover:text-white"
                >
                  <span className="text-[#8ec9db] transition group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                  </span>
                  Scheme Recommender
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/calculator"
                  className="group flex items-center gap-2.5 text-slate-300 transition hover:text-white"
                >
                  <span className="text-[#9dd9c8] transition group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <line x1="8" y1="6" x2="16" y2="6" />
                      <line x1="16" y1="14" x2="16" y2="14.01" />
                      <line x1="12" y1="14" x2="12" y2="14.01" />
                      <line x1="8" y1="14" x2="8" y2="14.01" />
                      <line x1="16" y1="18" x2="16" y2="18.01" />
                      <line x1="12" y1="18" x2="12" y2="18.01" />
                      <line x1="8" y1="18" x2="8" y2="18.01" />
                    </svg>
                  </span>
                  EMI Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/locator"
                  className="group flex items-center gap-2.5 text-slate-300 transition hover:text-white"
                >
                  <span className="text-[#a4cbd8] transition group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  Partner Locator
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/bookmarks"
                  className="group flex items-center gap-2.5 text-slate-300 transition hover:text-white"
                >
                  <span className="text-[#a4cbd8] transition group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  Bookmarks
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Column: CTA Card */}
          <div className="md:col-span-8 lg:col-span-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-lg">
              {/* Background Illustration covering the entire box */}
              <div className="absolute inset-0">
                <Image
                  src="/footer-cta-bg.png"
                  alt="Find government schemes"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover object-right"
                  priority
                />
              </div>

              {/* Soft left gradient overlay for optimal text legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#04264d]/80 via-[#04264d]/40 to-transparent w-[70%]" />

              {/* Content placed directly over the background */}
              <div className="relative z-10 flex min-h-[175px] flex-col justify-center p-5 sm:p-5.5">
                <div className="max-w-[210px] sm:max-w-[230px]">
                  <h4 className="font-display text-base font-semibold leading-tight text-white sm:text-lg">
                    Need help finding<br />a scheme?
                  </h4>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-200 sm:text-xs">
                    Tell us about your needs and we&apos;ll find schemes that match your profile.
                  </p>
                  <div className="mt-3.5">
                    <Link
                      href="/dashboard/recommender"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#fef4e4] px-4 py-1.5 text-xs font-semibold text-[#072439] shadow-xs transition hover:bg-white hover:gap-2"
                    >
                      Find My Schemes
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-7 border-t border-white/10 pt-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300">
                © 2026 Yojana Setu
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Smart India Hackathon prototype — not an official government portal. Scheme information should be verified with the respective authorities.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 sm:border-l sm:border-white/15 sm:pl-3.5">
              <p className="text-[11px] text-slate-300">
                Built with <span className="inline-block" role="img" aria-label="love">❤️</span> for a more inclusive and informed India.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
