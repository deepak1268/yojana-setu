"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { fetchSchemeMatches } from "@/lib/api";
import type { SchemeRecommendation, UserProfile } from "@/lib/types";

const categories = ["SC", "ST", "OBC", "General"];
const genders = ["Male", "Female", "Other"];
const occupations = ["self_employed", "salaried", "student", "unemployed"];
const educations = ["10th", "12th", "graduate", "postgraduate", "any"];
const purposes = ["business", "education", "housing", "agriculture"];
const projectTypes = ["micro_business", "manufacturing", "services", "higher_education"];

const initial: UserProfile = {
  category: "SC",
  gender: "Male",
  age: 25,
  annual_income: 300000,
  state: "Delhi",
  district: "New Delhi",
  occupation: "self_employed",
  education: "graduate",
  purpose: "business",
  project_type: "micro_business",
  project_cost: 100000,
  loan_required: 90000,
};

export default function RecommenderPage() {
  const [form, setForm] = useState<UserProfile>(initial);
  const [results, setResults] = useState<SchemeRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSchemeMatches(form);
      setResults(res.recommendations);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ys_last_recommendations", JSON.stringify(res.recommendations));
        window.localStorage.setItem("ys_user_profile", JSON.stringify(form));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scheme recommendations.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="Scheme recommender" subtitle="Fill in your details to see eligible schemes." />

      <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5 rounded-3xl border border-navy/10 bg-card p-6 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-ink">
                Category
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Gender
                <select
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Age
                <input
                  type="number"
                  min={18}
                  max={70}
                  value={form.age}
                  onChange={(e) => update("age", Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                Annual family income (₹)
                <input
                  type="number"
                  step={5000}
                  value={form.annual_income}
                  onChange={(e) => update("annual_income", Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                State
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                District
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => update("district", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                Occupation
                <select
                  value={form.occupation}
                  onChange={(e) => update("occupation", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {occupations.map((o) => (
                    <option key={o} value={o}>{o.replace("_", " ")}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Education
                <select
                  value={form.education}
                  onChange={(e) => update("education", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {educations.map((ed) => (
                    <option key={ed} value={ed}>{ed}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Purpose
                <select
                  value={form.purpose}
                  onChange={(e) => update("purpose", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {purposes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Project type
                <select
                  value={form.project_type}
                  onChange={(e) => update("project_type", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {projectTypes.map((p) => (
                    <option key={p} value={p}>{p.replace("_", " ")}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Project cost (₹)
                <input
                  type="number"
                  step={5000}
                  value={form.project_cost}
                  onChange={(e) => update("project_cost", Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                Loan required (₹)
                <input
                  type="number"
                  step={5000}
                  value={form.loan_required}
                  onChange={(e) => update("loan_required", Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-saffron px-5 py-3 text-sm font-semibold text-white hover:bg-saffron-deep disabled:opacity-50"
            >
              {loading ? "Finding matching schemes..." : "Find matching schemes"}
            </button>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-600">
                {error}
              </div>
            )}

            {!results && !error && (
              <div className="rounded-3xl border border-dashed border-navy/15 p-8 text-center text-sm text-muted">
                {loading ? "Matching applicant profile against schemes..." : "Fill in the form and submit to see your top matched schemes."}
              </div>
            )}

            {results?.map((r) => (
              <div key={r.scheme_id} className="rounded-3xl bg-navy p-6 text-cream">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-saffron uppercase">
                      Rank {r.rank} · {r.eligibility_status.replace("_", " ")}
                    </p>
                    <h3 className="mt-1 font-display text-xl">{r.scheme_name}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                    {r.match_score}% match
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
                  {r.financial_details.max_loan && (
                    <div>
                      <dt className="text-cream/55">Max loan</dt>
                      <dd className="font-medium">{r.financial_details.max_loan}</dd>
                    </div>
                  )}
                  {r.financial_details.interest_rate && (
                    <div>
                      <dt className="text-cream/55">Interest</dt>
                      <dd className="font-medium">{r.financial_details.interest_rate}</dd>
                    </div>
                  )}
                  {r.financial_details.max_tenure && (
                    <div>
                      <dt className="text-cream/55">Max tenure</dt>
                      <dd className="font-medium">{r.financial_details.max_tenure}</dd>
                    </div>
                  )}
                  {r.financial_details.moratorium && (
                    <div>
                      <dt className="text-cream/55">Moratorium</dt>
                      <dd className="font-medium">{r.financial_details.moratorium}</dd>
                    </div>
                  )}
                </dl>

                {r.warnings.length > 0 && (
                  <p className="mt-4 rounded-xl bg-saffron/15 px-3 py-2 text-xs text-saffron">
                    {r.warnings[0]}
                  </p>
                )}

                <a
                  href="/dashboard/calculator"
                  className="mt-4 inline-flex text-sm font-semibold text-saffron hover:text-saffron-deep"
                >
                  Calculate EMI for this scheme →
                </a>
              </div>
            ))}
          </div>
        </form>
      </div>
    </>
  );
}
