"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/Topbar";
import { sampleRecommendations } from "@/lib/mock-data";
import type { SchemeRecommendation } from "@/lib/types";

const actions = [
  { href: "/dashboard/recommender", title: "Re-run scheme match", body: "Update your inputs if your project or income changed." },
  { href: "/dashboard/calculator", title: "Adjust EMI calculation", body: "Try a different loan amount or tenure." },
  { href: "/dashboard/locator", title: "Find another partner", body: "Compare eligible SCAs, banks, and NBFC-MFIs nearby." },
];

export default function DashboardOverview() {
  const [top, setTop] = useState<SchemeRecommendation | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ys_last_recommendations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SchemeRecommendation[];
        if (parsed.length) {
          setTop(parsed[0]);
          setHasRun(true);
          return;
        }
      } catch {
        // fall through to sample data
      }
    }
    setTop(sampleRecommendations[0]);
  }, []);

  return (
    <>
      <Topbar title="Welcome back" subtitle="Here's where your application stands." />

      <div className="flex-1 space-y-8 px-5 py-6 sm:px-8 sm:py-8">
        {!hasRun && (
          <div className="rounded-2xl border border-saffron-deep/20 bg-saffron/10 px-5 py-4 text-sm text-saffron-deep">
            You haven&apos;t run the scheme recommender yet — the numbers below are a sample.{" "}
            <Link href="/dashboard/recommender" className="font-semibold underline">
              Run it now
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-navy/10 bg-card p-5">
            <p className="text-xs text-muted">Top matched scheme</p>
            <p className="mt-2 font-display text-xl text-ink">{top?.scheme_name ?? "—"}</p>
            <p className="mt-1 text-xs text-muted">{top?.match_score ?? 0}% match</p>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-card p-5">
            <p className="text-xs text-muted">Indicative rate</p>
            <p className="mt-2 font-display text-2xl text-ink">
              {top?.financial_details.interest_rate ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted">Max loan {top?.financial_details.max_loan ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-card p-5">
            <p className="text-xs text-muted">Eligibility status</p>
            <p className="mt-2 font-display text-xl text-ink capitalize">
              {top?.eligibility_status.replace("_", " ") ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted">{top?.warnings[0] ?? "No warnings"}</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-2xl bg-navy p-5 text-cream transition hover:bg-ink"
              >
                <p className="font-display text-lg">{a.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-cream/70">{a.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
