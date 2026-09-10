"use client";

import { useEffect, useState, useTransition } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { fetchEmiCalculation, fetchSchemes } from "@/lib/api";
import type {
  EmiCalculatorResponse,
  SchemeRecommendation,
  SchemeSummary,
} from "@/lib/types";

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const categoriesFilter = [
  "All",
  "SC",
  "ST",
  "OBC",
  "General",
  "Women",
  "Farmers",
  "Students",
  "Senior Citizens",
  "Artisans",
  "EWS",
];

const purposesFilter = [
  "All",
  "business",
  "education",
  "agriculture",
  "housing",
  "self_employment",
  "micro_business",
  "startup",
  "livelihood",
  "skill_development",
  "healthcare",
];

const statesFilter = [
  "All",
  "Delhi",
  "Haryana",
  "Uttar Pradesh",
  "Rajasthan",
  "Maharashtra",
  "Gujarat",
  "Punjab",
  "Karnataka",
  "Tamil Nadu",
  "West Bengal",
  "Bihar",
  "Madhya Pradesh",
];

export default function CalculatorPage() {
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [schemes, setSchemes] = useState<SchemeSummary[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>("");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [purpose, setPurpose] = useState("All");
  const [state, setState] = useState("All");

  // Calculator Parameters
  const [amount, setAmount] = useState(90000);
  const [months, setMonths] = useState(36);
  const [moratorium, setMoratorium] = useState(0);

  // States
  const [schemesLoading, setSchemesLoading] = useState(true);
  const [emiResult, setEmiResult] = useState<EmiCalculatorResponse | null>(null);
  const [emiLoading, setEmiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // 1. Load cached recommendations from recommender run if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("ys_last_recommendations");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SchemeRecommendation[];
          if (parsed.length) setRecommendations(parsed);
        } catch {
          // Ignore invalid storage
        }
      }
    }
  }, []);

  // 2. Load schemes from backend on mount or filter change
  useEffect(() => {
    let isCancelled = false;
    setSchemesLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      fetchSchemes({
        search: search.trim() || undefined,
        category: category !== "All" ? category : undefined,
        purpose: purpose !== "All" ? purpose : undefined,
        state: state !== "All" ? state : undefined,
      })
        .then((res) => {
          if (!isCancelled) {
            setSchemes(res.schemes || []);
            // Auto-select first scheme if none selected or if selected was filtered out
            setSelectedSchemeId((prev) => {
              const exists = res.schemes.some((s) => s.scheme_id === prev);
              if (exists) return prev;
              return res.schemes.length > 0 ? res.schemes[0].scheme_id : "";
            });
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            setError(err instanceof Error ? err.message : "Failed to load schemes from backend.");
          }
        })
        .finally(() => {
          if (!isCancelled) setSchemesLoading(false);
        });
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [search, category, purpose, state]);

  // Current selected scheme
  const currentScheme = schemes.find((s) => s.scheme_id === selectedSchemeId) || schemes[0];

  const maxLoan = currentScheme?.max_amount || 1000000;
  const minLoan = currentScheme?.min_amount || 10000;
  const maxTenure = currentScheme?.max_tenure || 84;
  const minTenure = currentScheme?.min_tenure || 6;
  const maxMoratorium = currentScheme?.max_moratorium || 0;

  // Sync loan parameters when scheme changes
  useEffect(() => {
    if (!currentScheme) return;
    startTransition(() => {
      setAmount((prev) => Math.max(minLoan, Math.min(prev, maxLoan)));
      setMonths((prev) => Math.max(minTenure, Math.min(prev, maxTenure)));
      setMoratorium((prev) => Math.min(prev, maxMoratorium));
    });
  }, [currentScheme?.scheme_id, minLoan, maxLoan, minTenure, maxTenure, maxMoratorium]);

  // 3. Perform EMI calculation via FastAPI POST /calculator/emi
  useEffect(() => {
    if (!currentScheme) {
      setEmiResult(null);
      return;
    }

    let isCancelled = false;
    setEmiLoading(true);
    setError(null);

    const safeAmount = Math.max(minLoan, Math.min(amount, maxLoan));
    const safeTenure = Math.max(minTenure, Math.min(months, maxTenure));
    const safeMoratorium = Math.min(moratorium, maxMoratorium);

    fetchEmiCalculation({
      scheme_id: currentScheme.scheme_id,
      loan_amount: safeAmount,
      tenure_months: safeTenure,
      moratorium_months: safeMoratorium,
    })
      .then((data) => {
        if (!isCancelled) setEmiResult(data);
      })
      .catch((err) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : "Calculation failed.");
      })
      .finally(() => {
        if (!isCancelled) setEmiLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentScheme?.scheme_id, amount, months, moratorium, minLoan, maxLoan, minTenure, maxTenure, maxMoratorium]);

  return (
    <>
      <Topbar
        title="Financial calculator"
        subtitle="Explore the complete government scheme dataset and calculate exact EMI terms."
      />

      <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8 space-y-6">
        {/* Recommended schemes quick selection if available */}
        {recommendations.length > 0 && (
          <div className="rounded-2xl border border-navy/10 bg-card p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Recommended for your profile:
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((r) => (
                <button
                  key={r.scheme_id}
                  type="button"
                  onClick={() => {
                    // Check if scheme is in current list; if not reset filters to include it
                    setSelectedSchemeId(r.scheme_id);
                    if (!schemes.some((s) => s.scheme_id === r.scheme_id)) {
                      setCategory("All");
                      setPurpose("All");
                      setState("All");
                      setSearch("");
                    }
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedSchemeId === r.scheme_id
                      ? "bg-saffron text-white"
                      : "bg-navy/8 text-ink hover:bg-navy/15"
                  }`}
                >
                  Rank {r.rank} · {r.scheme_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dataset Filters Bar */}
        <div className="rounded-3xl border border-navy/10 bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search schemes by name, keyword, or scheme ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-auto">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-navy/15 bg-background px-3 py-2 text-xs font-medium text-ink outline-none focus:border-saffron"
                aria-label="Category filter"
              >
                <option disabled>Category</option>
                {categoriesFilter.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>

              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="rounded-xl border border-navy/15 bg-background px-3 py-2 text-xs font-medium text-ink outline-none focus:border-saffron"
                aria-label="Purpose filter"
              >
                <option disabled>Purpose</option>
                {purposesFilter.map((p) => (
                  <option key={p} value={p}>
                    {p === "All" ? "All Purposes" : p.replace("_", " ")}
                  </option>
                ))}
              </select>

              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-xl border border-navy/15 bg-background px-3 py-2 text-xs font-medium text-ink outline-none focus:border-saffron"
                aria-label="State filter"
              >
                <option disabled>State</option>
                {statesFilter.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All States" : s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheme selector dropdown */}
          <div className="border-t border-navy/8 pt-3">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
              Select Scheme ({schemes.length} available)
            </label>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              disabled={schemesLoading || schemes.length === 0}
              className="w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 disabled:opacity-50"
            >
              {schemes.map((s) => (
                <option key={s.scheme_id} value={s.scheme_id}>
                  {s.name} ({s.interest_rate_str || "Concessional rate"} · Max {s.max_amount ? formatInr(s.max_amount) : "N/A"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty state when no schemes match */}
        {!schemesLoading && schemes.length === 0 && (
          <div className="rounded-3xl border border-dashed border-navy/15 p-8 text-center text-sm text-muted">
            No schemes found.
          </div>
        )}

        {/* Calculator Body */}
        {currentScheme && (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Parameters Column */}
            <div className="rounded-3xl border border-navy/10 bg-card p-6 sm:p-7 space-y-6">
              <div>
                <h3 className="font-display text-lg text-ink">{currentScheme.name}</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                  {currentScheme.description || "Government financial assistance scheme."}
                </p>
              </div>

              {/* Loan Amount Control */}
              <div>
                <div className="flex justify-between items-center text-sm font-medium text-ink">
                  <span>Loan Amount</span>
                  <span className="font-display text-base text-saffron">{formatInr(amount)}</span>
                </div>
                <input
                  type="range"
                  min={minLoan}
                  max={maxLoan}
                  step={5000}
                  value={Math.min(amount, maxLoan)}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-3 w-full accent-saffron"
                />
                <div className="flex justify-between text-[11px] text-muted mt-1">
                  <span>Min: {formatInr(minLoan)}</span>
                  <span>Max: {formatInr(maxLoan)}</span>
                </div>
              </div>

              {/* Tenure Control */}
              <div>
                <div className="flex justify-between items-center text-sm font-medium text-ink">
                  <span>Repayment Tenure</span>
                  <span className="font-display text-base text-green">{months} months</span>
                </div>
                <input
                  type="range"
                  min={minTenure}
                  max={maxTenure}
                  step={6}
                  value={Math.min(months, maxTenure)}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="mt-3 w-full accent-green"
                />
                <div className="flex justify-between text-[11px] text-muted mt-1">
                  <span>Min: {minTenure} mos</span>
                  <span>Max: {maxTenure} mos</span>
                </div>
              </div>

              {/* Moratorium Control */}
              <div>
                <div className="flex justify-between items-center text-sm font-medium text-ink">
                  <span>Moratorium Period</span>
                  <span className="font-display text-base text-navy">{moratorium} months</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, maxMoratorium)}
                  step={1}
                  disabled={maxMoratorium === 0}
                  value={Math.min(moratorium, maxMoratorium)}
                  onChange={(e) => setMoratorium(Number(e.target.value))}
                  className="mt-3 w-full accent-navy disabled:opacity-40"
                />
                <div className="flex justify-between text-[11px] text-muted mt-1">
                  <span>0 months</span>
                  <span>Max allowed: {maxMoratorium} months</span>
                </div>
              </div>

              <div className="rounded-2xl bg-navy/5 p-4 text-xs text-muted space-y-1">
                <p>
                  <strong className="text-ink">Indicative Interest Rate:</strong>{" "}
                  {currentScheme.interest_rate_str || "Standard concessional terms"}
                </p>
                <p>
                  <strong className="text-ink">Target Categories:</strong>{" "}
                  {currentScheme.categories?.length ? currentScheme.categories.join(", ") : "All eligible applicants"}
                </p>
              </div>
            </div>

            {/* Results Column */}
            <div className="space-y-5">
              {error && (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Summary Cards */}
              <div className="rounded-3xl bg-navy p-6 text-cream sm:p-7">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-cream/60">Monthly EMI</p>
                    <p className="mt-1 font-display text-2xl text-saffron">
                      {emiLoading ? "..." : emiResult ? formatInr(emiResult.summary.monthly_emi) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-cream/60">Total Interest</p>
                    <p className="mt-1 font-display text-2xl text-cream">
                      {emiLoading ? "..." : emiResult ? formatInr(emiResult.summary.total_interest) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-cream/60">Applied Rate</p>
                    <p className="mt-1 font-display text-2xl text-cream">
                      {emiResult ? `${emiResult.interest_rate_used}%` : "—"}
                    </p>
                  </div>
                </div>

                {emiResult && (
                  <div className="mt-4 border-t border-white/10 pt-4 flex justify-between text-xs text-cream/70">
                    <span>Principal: {formatInr(emiResult.summary.loan_amount)}</span>
                    <span>Total Repayment: {formatInr(emiResult.summary.total_repayment)}</span>
                  </div>
                )}
              </div>

              {/* Amortization Schedule Table */}
              <div className="rounded-3xl border border-navy/10 bg-card p-6 sm:p-7">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-semibold text-ink">First 6 Months Amortization</p>
                  {moratorium > 0 && (
                    <span className="rounded-full bg-saffron/15 px-2.5 py-0.5 text-[11px] font-semibold text-saffron-deep">
                      {moratorium} mos Moratorium
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-muted border-b border-navy/8">
                        <th className="pb-2 font-medium">Month</th>
                        <th className="pb-2 font-medium">Payment</th>
                        <th className="pb-2 font-medium">Principal</th>
                        <th className="pb-2 font-medium">Interest</th>
                        <th className="pb-2 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/8">
                      {emiResult?.amortization_schedule.slice(0, 6).map((row) => (
                        <tr key={row.month}>
                          <td className="py-2.5 text-ink font-medium">
                            Month {row.month}{" "}
                            {row.phase === "Moratorium" && (
                              <span className="text-[10px] text-saffron font-normal">(Moratorium)</span>
                            )}
                          </td>
                          <td className="py-2.5 text-ink">{formatInr(row.payment)}</td>
                          <td className="py-2.5 text-ink">{formatInr(row.principal)}</td>
                          <td className="py-2.5 text-muted">{formatInr(row.interest)}</td>
                          <td className="py-2.5 text-muted">{formatInr(row.closing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
