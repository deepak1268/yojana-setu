"use client";

import { useMemo, useState } from "react";

const options = [
  {
    id: "micro",
    label: "Small project",
    hint: "Up to ₹1.40 lakh",
    scheme: "Micro Finance Scheme",
    rate: "From 6.5% p.a.",
    cover: "Up to 90% of project cost",
    partner: "NBFC-MFI / SCA",
  },
  {
    id: "term",
    label: "Larger enterprise",
    hint: "Up to ₹50 lakh",
    scheme: "Term Loan Scheme",
    rate: "Concessional 6.5–8%",
    cover: "Up to 90% of project cost",
    partner: "SCA / PSB / RRB",
  },
  {
    id: "edu",
    label: "Education",
    hint: "Professional / higher studies",
    scheme: "Educational Loan Scheme",
    rate: "Concessional education rates",
    cover: "Tuition + related costs",
    partner: "PSB / SCA",
  },
] as const;

export function SchemeMatcher() {
  const [choice, setChoice] = useState<(typeof options)[number]["id"]>("micro");
  const result = useMemo(
    () => options.find((o) => o.id === choice) ?? options[0],
    [choice],
  );

  return (
    <div
      id="matcher"
      className="scroll-mt-28 rounded-3xl border border-white/10 bg-navy p-5 text-cream shadow-2xl shadow-navy/30 sm:p-6"
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-saffron uppercase">
        Smart scheme recommender
      </p>
      <h3 className="mt-2 font-display text-2xl text-cream">
        What do you need credit for?
      </h3>
      <p className="mt-1.5 text-sm text-cream/70">
        Choose the path closest to your goal. We&apos;ll tailor the full
        recommendation using your income, project cost, and location.
      </p>

      <div className="mt-5 grid gap-2">
        {options.map((opt) => {
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setChoice(opt.id)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <span>
                <span className="block text-sm font-semibold">{opt.label}</span>
                <span className="text-xs text-cream/65">{opt.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-cream p-4 text-ink">
        <p className="text-xs font-semibold tracking-wide text-saffron-deep uppercase">
          Recommended
        </p>
        <p className="mt-1 font-display text-xl">{result.scheme}</p>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Indicative rate</dt>
            <dd className="font-medium">{result.rate}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Typical cover</dt>
            <dd className="font-medium">{result.cover}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Likely partner</dt>
            <dd className="font-medium">{result.partner}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
