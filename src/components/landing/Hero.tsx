import { SchemeMatcher } from "./SchemeMatcher";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grain opacity-[0.07]" />
      <div className="absolute -top-24 right-[-8%] h-80 w-80 rounded-full bg-saffron/15 blur-3xl" />
      <div className="absolute bottom-0 left-[-10%] h-72 w-72 rounded-full bg-green/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <h1 className="font-display text-4xl leading-[1.12] font-medium tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            The right scheme.{" "}
            <span className="text-saffron-deep">The nearest eligible partner.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Concessional loans for SC entrepreneurs and students exist — but
            applications do not go directly to the corporation. Yojana Setu
            matches your need to a scheme, estimates EMIs, and routes you to a
            channel partner who can actually process it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#matcher"
              className="rounded-full bg-saffron px-5 py-3 text-sm font-semibold text-white shadow-md shadow-saffron/25 transition hover:bg-saffron-deep"
            >
              Match a scheme
            </a>
            <a
              href="#features"
              className="rounded-full border border-navy/15 bg-card px-5 py-3 text-sm font-semibold text-ink hover:border-navy/30"
            >
              See how it works
            </a>
          </div>

          <dl className="mt-10 grid w-full grid-cols-3 gap-4 border-t border-navy/10 px-6 pt-6 sm:px-10">
            <div>
              <dt className="text-xs text-muted">Family income</dt>
              <dd className="mt-1 font-display text-xl text-ink sm:text-2xl">
                ≤ ₹5L
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Channel partners</dt>
              <dd className="mt-1 font-display text-xl text-ink sm:text-2xl">
                100+
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Typical rates</dt>
              <dd className="mt-1 font-display text-xl text-ink sm:text-2xl">
                6.5–8%
              </dd>
            </div>
          </dl>
        </div>

        <SchemeMatcher />
      </div>
    </section>
  );
}
