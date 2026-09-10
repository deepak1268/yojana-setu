"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { sampleRecommendations } from "@/lib/mock-data";
import type { SchemeRecommendation } from "@/lib/types";

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

// financial_details values come from ai/scheme_matcher.py as display strings
// (e.g. "6.5% - 8%", "84 months") — parse them back into numbers for the calculator.
function parseRate(rate?: string): number {
  if (!rate) return 8;
  const nums = rate.match(/[\d.]+/g)?.map(Number) ?? [8];
  return nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0];
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
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>(sampleRecommendations);
  const [schemeIndex, setSchemeIndex] = useState(0);
  const [amount, setAmount] = useState(450000);
  const [months, setMonths] = useState(60);

  useEffect(() => {
    const stored = window.localStorage.getItem("ys_last_recommendations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SchemeRecommendation[];
        if (parsed.length) setRecommendations(parsed);
      } catch {
        // fall back to sample data
      }
    }
  }, []);

  const scheme = recommendations[schemeIndex];
  const rate = parseRate(scheme.financial_details.interest_rate) / 100;
  const maxTenure = parseMonths(scheme.financial_details.max_tenure);
  const maxLoan = parseMaxLoan(scheme.financial_details.max_loan);
  const cappedAmount = Math.min(amount, maxLoan);

  const { emi, totalInterest, schedule } = useMemo(() => {
    const r = rate / 12;
    const n = Math.min(months, maxTenure) || 1;
    const monthlyEmi = r === 0 ? cappedAmount / n : (cappedAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let balance = cappedAmount;
    const rows: { month: number; principal: number; interest: number; balance: number }[] = [];
    for (let m = 1; m <= Math.min(n, 6); m++) {
      const interest = balance * r;
      const principal = monthlyEmi - interest;
      balance = Math.max(balance - principal, 0);
      rows.push({ month: m, principal, interest, balance });
    }
    return { emi: monthlyEmi, totalInterest: monthlyEmi * n - cappedAmount, schedule: rows };
  }, [cappedAmount, months, maxTenure, rate]);

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
                value={amount}
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
              Moratorium: {scheme.financial_details.moratorium ?? "as per scheme"} · Rate used: {(rate * 100).toFixed(1)}%
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl bg-navy p-6 text-cream sm:p-7">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-cream/60">Monthly EMI</p>
                  <p className="mt-1 font-display text-2xl">{formatInr(emi)}</p>
                </div>
                <div>
                  <p className="text-xs text-cream/60">Total interest</p>
                  <p className="mt-1 font-display text-2xl">{formatInr(totalInterest)}</p>
                </div>
                <div>
                  <p className="text-xs text-cream/60">Rate</p>
                  <p className="mt-1 font-display text-2xl">{(rate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-navy/10 bg-card p-6 sm:p-7">
              <p className="text-sm font-semibold text-ink">First 6 months</p>
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
                  {schedule.map((row) => (
                    <tr key={row.month}>
                      <td className="py-2 text-ink">{row.month}</td>
                      <td className="py-2 text-ink">{formatInr(row.principal)}</td>
                      <td className="py-2 text-muted">{formatInr(row.interest)}</td>
                      <td className="py-2 text-muted">{formatInr(row.balance)}</td>
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
