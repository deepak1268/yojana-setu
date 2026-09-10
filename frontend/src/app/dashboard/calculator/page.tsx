"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { fetchEmiCalculation } from "@/lib/api";
import type { EmiCalculatorResponse, SchemeRecommendation } from "@/lib/types";

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function parseMonths(text?: string): number {
  if (!text) return 60;
  const n = text.match(/\d+/);
  return n ? Number(n[0]) : 60;
}

function parseMaxLoan(text?: string): number {
  if (!text) return 500000;
  const n = text.replace(/[^\d]/g, "");
  return n ? Number(n) : 500000;
}

export default function CalculatorPage() {
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [schemeIndex, setSchemeIndex] = useState(0);
  const [amount, setAmount] = useState(90000);
  const [months, setMonths] = useState(60);
  const [moratorium, setMoratorium] = useState(0);
  const [emiResult, setEmiResult] = useState<EmiCalculatorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("ys_last_recommendations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SchemeRecommendation[];
        if (parsed.length) setRecommendations(parsed);
      } catch {
        // Ignore invalid storage
      }
    }
  }, []);

  const scheme = recommendations[schemeIndex];
  const maxTenure = scheme ? parseMonths(scheme.financial_details.max_tenure) : 60;
  const maxLoan = scheme ? parseMaxLoan(scheme.financial_details.max_loan) : 500000;

  useEffect(() => {
    if (!scheme) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const moratoriumMonths = parseMonths(scheme.financial_details.moratorium) || 0;
    setMoratorium(moratoriumMonths);

    fetchEmiCalculation({
      scheme_id: scheme.scheme_id,
      loan_amount: Math.min(amount, maxLoan),
      tenure_months: Math.min(months, maxTenure) || 12,
      moratorium_months: moratoriumMonths,
    })
      .then((data) => {
        if (!isCancelled) setEmiResult(data);
      })
      .catch((err) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : "Calculation failed.");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [scheme, amount, months, maxLoan, maxTenure]);

  if (!scheme) {
    return (
      <>
        <Topbar title="EMI calculator" subtitle="Based on the scheme you were matched with." />
        <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <div className="rounded-3xl border border-dashed border-navy/15 p-8 text-center text-sm text-muted">
            Please run the scheme recommender first to populate matched schemes for calculation.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="EMI calculator" subtitle="Based on the scheme you were matched with." />

      <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-navy/10 bg-card p-6 sm:p-7">
            <div className="flex flex-wrap gap-2">
              {recommendations.map((r, i) => (
                <button
                  key={r.scheme_id}
                  type="button"
                  onClick={() => {
                    setSchemeIndex(i);
                    setMonths(Math.min(months, parseMonths(r.financial_details.max_tenure)));
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    i === schemeIndex ? "bg-navy text-cream" : "bg-navy/8 text-ink hover:bg-navy/12"
                  }`}
                >
                  {r.scheme_name}
                </button>
              ))}
            </div>

            <label className="mt-6 block text-sm font-medium text-muted">
              Loan amount · {formatInr(amount)} (cap {formatInr(maxLoan)})
              <input
                type="range"
                min={20000}
                max={maxLoan}
                step={5000}
                value={Math.min(amount, maxLoan)}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-3 w-full accent-saffron"
              />
            </label>

            <label className="mt-6 block text-sm font-medium text-muted">
              Tenure · {Math.min(months, maxTenure)} months (max {maxTenure})
              <input
                type="range"
                min={6}
                max={maxTenure}
                step={6}
                value={Math.min(months, maxTenure)}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-3 w-full accent-green"
              />
            </label>

            <p className="mt-5 text-xs text-muted">
              Moratorium: {scheme.financial_details.moratorium ?? "as per scheme"} · Rate used: {emiResult ? `${emiResult.interest_rate_used}%` : scheme.financial_details.interest_rate ?? "—"}
            </p>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="rounded-3xl bg-navy p-6 text-cream sm:p-7">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-cream/60">Monthly EMI</p>
                  <p className="mt-1 font-display text-2xl">
                    {loading ? "..." : emiResult ? formatInr(emiResult.summary.monthly_emi) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-cream/60">Total interest</p>
                  <p className="mt-1 font-display text-2xl">
                    {loading ? "..." : emiResult ? formatInr(emiResult.summary.total_interest) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-cream/60">Rate</p>
                  <p className="mt-1 font-display text-2xl">
                    {emiResult ? `${emiResult.interest_rate_used}%` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-navy/10 bg-card p-6 sm:p-7">
              <p className="text-sm font-semibold text-ink">First 6 months schedule</p>
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-muted">
                    <th className="pb-2 font-medium">Month</th>
                    <th className="pb-2 font-medium">Principal</th>
                    <th className="pb-2 font-medium">Interest</th>
                    <th className="pb-2 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/8">
                  {emiResult?.amortization_schedule.slice(0, 6).map((row) => (
                    <tr key={row.month}>
                      <td className="py-2 text-ink">
                        {row.month} {row.phase === "Moratorium" ? "(Mor)" : ""}
                      </td>
                      <td className="py-2 text-ink">{formatInr(row.principal)}</td>
                      <td className="py-2 text-muted">{formatInr(row.interest)}</td>
                      <td className="py-2 text-muted">{formatInr(row.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
