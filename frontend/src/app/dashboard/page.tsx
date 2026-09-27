"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarkContext";
import type { SchemeRecommendation } from "@/lib/types";

const actions = [
  { href: "/dashboard/recommender", title: "Re-run scheme match", body: "Update your inputs if your project or income changed." },
  { href: "/dashboard/calculator", title: "Adjust EMI calculation", body: "Try a different loan amount or tenure." },
  { href: "/dashboard/locator", title: "Find another partner", body: "Compare eligible SCAs, banks, and NBFC-MFIs nearby." },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [top, setTop] = useState<SchemeRecommendation | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const firstName = user?.name ? user.name.trim().split(" ")[0] : "Deepak";

  useEffect(() => {
    const stored = window.localStorage.getItem("ys_last_recommendations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SchemeRecommendation[];
        if (parsed.length) {
          setTop(parsed[0]);
          setHasRun(true);
        }
      } catch {
        // Ignore invalid storage
      }
    }
  }, []);

  return (
    <>
      <Topbar title="Welcome back" subtitle="Here's where your application stands." />

      <div className="flex-1 space-y-8 px-5 py-6 sm:px-8 sm:py-8">
        {/* HERO SECTION / VISUAL BANNER */}
        <div className="relative overflow-hidden rounded-[2rem] border border-navy/10 bg-[#fef4e4] shadow-sm">
          {/* Background Illustration covering the entire banner */}
          <div className="absolute inset-0">
            <Image
              src="/dashboard-banner.png"
              alt="Government schemes visual banner"
              fill
              className="object-cover object-right"
              priority
            />
          </div>

          {/* Soft left gradient overlay for perfect text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#fef4e4] via-[#fef4e4]/85 to-transparent w-full sm:w-[55%] md:w-[48%]" />

          {/* Content layered directly over the left portion of the illustration */}
          <div className="relative z-10 flex min-h-[200px] flex-col justify-center p-6 sm:p-7 lg:min-h-[220px] lg:py-8 lg:pl-8">
            <div>
              <p className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                Hi {firstName},
              </p>
              <h2 className="mt-1.5 font-display text-lg font-medium tracking-tight text-ink sm:text-base lg:text-[19px] whitespace-nowrap">
                Let&apos;s find the right government schemes for you
              </h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted sm:text-sm">
                Explore, compare and apply to schemes that match your profile and goals.
              </p>
            </div>

            <div className="mt-5">
              <Link
                href="/dashboard/recommender"
                className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-xs font-semibold text-cream shadow-sm transition hover:bg-ink hover:gap-3 sm:text-sm"
              >
                Get Recommendations
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {!hasRun && (
          <div className="rounded-2xl border border-saffron-deep/20 bg-saffron/10 px-5 py-4 text-sm text-saffron-deep">
            You haven&apos;t run the scheme recommender yet.{" "}
            <Link href="/dashboard/recommender" className="font-semibold underline">
              Run scheme match now
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-navy/10 bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Top matched scheme</p>
              {top && (
                <button
                  type="button"
                  onClick={() => toggleBookmark(top)}
                  title={isBookmarked(top.scheme_id) ? "Remove from bookmarks" : "Save scheme"}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                    isBookmarked(top.scheme_id)
                      ? "border-saffron bg-saffron text-white shadow-xs"
                      : "border-navy/15 bg-background text-muted hover:border-saffron hover:text-saffron"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill={isBookmarked(top.scheme_id) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
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
