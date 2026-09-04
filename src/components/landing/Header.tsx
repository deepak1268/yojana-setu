import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-cream/85 backdrop-blur-md">
      <div className="tricolor-bar h-1 w-full" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-cream shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path
                d="M4 18V8.5L12 4l8 4.5V18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M8 18v-5.5h8V18"
                stroke="#E36A1A"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <span className="block font-display text-lg leading-none font-semibold text-ink">
              Yojana Setu
            </span>
            <span className="text-[11px] tracking-wide text-muted">
              योजना सेतु
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-ink/80 md:flex">
          <a href="#features" className="hover:text-saffron-deep">
            Features
          </a>
          <a href="#calculator" className="hover:text-saffron-deep">
            Calculator
          </a>
          <a href="#how-it-works" className="hover:text-saffron-deep">
            How it works
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-cream shadow-sm transition hover:bg-ink"
        >
          Find my scheme
        </Link>
      </div>
      <nav className="flex gap-5 overflow-x-auto border-t border-navy/5 px-5 py-2.5 text-xs font-medium text-ink/75 md:hidden">
        <a href="#features">Features</a>
        <a href="#calculator">Calculator</a>
        <a href="#how-it-works">How it works</a>
      </nav>
    </header>
  );
}
