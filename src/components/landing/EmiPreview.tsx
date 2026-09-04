"use client";

import { useMemo, useState } from "react";

const schemes = [
  {
    name: "Micro Finance",
    cap: 1.4,
    rate: 0.065,
    months: 36,
    note: "Small projects · typically via NBFC-MFI / SCA",
  },
  {
    name: "Term Loan",
    cap: 50,
    rate: 0.075,
    months: 84,
    note: "Larger enterprises · SCA / PSB / RRB",
  },
  {
    name: "Education Loan",
    cap: 20,
    rate: 0.08,
    months: 84,
    note: "After moratorium of 3–12 months",
  },
];

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function EmiPreview() {
  const [schemeIndex, setSchemeIndex] = useState(0);
  const [lakhs, setLakhs] = useState(1.2);
  const scheme = schemes[schemeIndex];
  const amount = Math.min(lakhs, scheme.cap) * 100000;

  const emi = useMemo(() => {
    const r = scheme.rate / 12;
    const n = scheme.months;
    if (r === 0) return amount / n;
    return (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [amount, scheme]);

  return (
    <section id="calculator" className="scroll-mt-[25vh] border-y border-navy/8 bg-navy text-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-saffron uppercase">
            Financial calculator
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            See the EMI before you queue at a bank.
          </h2>
          <p className="mt-4 max-w-md text-cream/75">
            Adjust the loan amount to compare estimated monthly repayments.
            Final rates and repayment terms depend on your scheme and the
            channel partner&apos;s approval.
          </p>
        </div>

        <div className="rounded-3xl bg-cream p-6 text-ink shadow-xl">
          <div className="flex flex-wrap gap-2">
            {schemes.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => {
                  setSchemeIndex(i);
                  setLakhs(Math.min(lakhs, s.cap));
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  i === schemeIndex
                    ? "bg-navy text-cream"
                    : "bg-navy/8 text-ink hover:bg-navy/12"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <label className="mt-6 block text-sm font-medium text-muted">
            Loan amount · ₹{lakhs.toFixed(2)} lakh (cap ₹{scheme.cap} lakh)
            <input
              type="range"
              min={0.2}
              max={scheme.cap}
              step={0.1}
              value={lakhs}
              onChange={(e) => setLakhs(Number(e.target.value))}
              className="mt-3 w-full accent-saffron"
            />
          </label>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-navy/10 pt-5">
            <div>
              <p className="text-xs text-muted">Indicative EMI</p>
              <p className="mt-1 font-display text-3xl text-ink">
                {formatInr(emi)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Assumed rate / tenor</p>
              <p className="mt-1 text-sm font-semibold">
                {(scheme.rate * 100).toFixed(1)}% · {scheme.months} months
              </p>
              <p className="mt-1 text-xs text-muted">{scheme.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
