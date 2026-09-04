import Link from "next/link";

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-navy/10 bg-card p-7 sm:p-9 md:flex-row md:items-center md:px-10">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl text-ink">
            Find the right scheme for your next step.
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Answer a few simple questions to discover the loan or education
            scheme that best fits your plans, along with an estimated EMI and
            clear next steps.
          </p>
        </div>
        <Link
          href="/login"
          className="shrink-0 rounded-full bg-saffron px-6 py-3 text-sm font-semibold text-white hover:bg-saffron-deep"
        >
          Find my scheme
        </Link>
      </div>
    </section>
  );
}
