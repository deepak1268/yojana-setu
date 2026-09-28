"use client";

import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/Topbar";
import { useBookmarks } from "@/context/BookmarkContext";

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, loading } = useBookmarks();
  const [search, setSearch] = useState("");

  const filtered = bookmarks.filter((b) =>
    b.scheme_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Topbar
        title="Saved schemes"
        subtitle="Review, compare, and take action on your bookmarked government schemes."
      />

      <div className="flex-1 space-y-6 px-5 py-6 sm:px-8 sm:py-8">
        {/* Search & Counter Bar */}
        {bookmarks.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-muted">
              {filtered.length} of {bookmarks.length} scheme{bookmarks.length === 1 ? "" : "s"} saved
            </p>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved schemes..."
                className="w-full rounded-full border border-navy/15 bg-background px-4 py-2 pl-9 text-sm outline-none transition focus:border-saffron focus:ring-4 focus:ring-saffron/10"
              />
              <svg
                viewBox="0 0 24 24"
                className="absolute left-3 top-2.5 h-4 w-4 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </div>
        )}

        {/* Empty State */}
        {bookmarks.length === 0 && !loading && (
          <div className="mx-auto max-w-lg rounded-3xl border border-navy/10 bg-card p-10 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-saffron/10 text-saffron">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                  d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5v16.2a.8.8 0 0 1-1.25.66L12 18l-4.75 3.36A.8.8 0 0 1 6 20.7V4.5Z"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mt-5 font-display text-2xl text-ink">No saved schemes yet</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Bookmark schemes from the Scheme Recommender to easily compare interest rates, calculate EMIs, and track application documents here.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/recommender"
                className="inline-flex items-center gap-2 rounded-full bg-saffron px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-saffron-deep"
              >
                Find matching schemes
                <span>→</span>
              </Link>
            </div>
          </div>
        )}

        {/* No Search Results State */}
        {bookmarks.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-navy/20 p-8 text-center text-sm text-muted">
            No saved schemes match &ldquo;{search}&rdquo;. Try another search term.
          </div>
        )}

        {/* Bookmarks Grid */}
        {filtered.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((scheme) => (
              <div
                key={scheme.scheme_id}
                className="flex flex-col justify-between rounded-3xl bg-navy p-6 text-cream shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
                        {scheme.eligibility_status.replace("_", " ")}
                      </p>
                      <h3 className="mt-1 font-display text-xl leading-snug">{scheme.scheme_name}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {scheme.match_score > 0 && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cream">
                          {scheme.match_score}% match
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeBookmark(scheme.scheme_id)}
                        title="Remove from saved schemes"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-cream transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-300"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
                    {scheme.financial_details.max_loan && (
                      <div>
                        <dt className="text-xs text-cream/55">Max loan</dt>
                        <dd className="font-semibold text-cream">{scheme.financial_details.max_loan}</dd>
                      </div>
                    )}
                    {scheme.financial_details.interest_rate && (
                      <div>
                        <dt className="text-xs text-cream/55">Interest rate</dt>
                        <dd className="font-semibold text-saffron">{scheme.financial_details.interest_rate}</dd>
                      </div>
                    )}
                    {scheme.financial_details.max_tenure && (
                      <div>
                        <dt className="text-xs text-cream/55">Max tenure</dt>
                        <dd className="font-semibold text-cream">{scheme.financial_details.max_tenure}</dd>
                      </div>
                    )}
                    {scheme.financial_details.moratorium && (
                      <div>
                        <dt className="text-xs text-cream/55">Moratorium</dt>
                        <dd className="font-semibold text-cream">{scheme.financial_details.moratorium}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Required Documents Checklist preview */}
                  {scheme.documents && scheme.documents.length > 0 && (
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <p className="text-xs font-semibold text-cream/60">Required documents:</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {scheme.documents.slice(0, 3).map((doc, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-cream/75"
                          >
                            ✓ {doc}
                          </span>
                        ))}
                        {scheme.documents.length > 3 && (
                          <span className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-cream/50">
                            +{scheme.documents.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warnings if any */}
                  {scheme.warnings && scheme.warnings.length > 0 && (
                    <p className="mt-3 rounded-xl bg-saffron/15 px-3 py-2 text-xs text-saffron">
                      {scheme.warnings[0]}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard/calculator"
                      className="text-xs font-semibold text-saffron hover:underline"
                    >
                      Calculate EMI →
                    </Link>
                    <span className="text-white/20">·</span>
                    <Link
                      href="/dashboard/locator"
                      className="text-xs font-semibold text-cream/80 hover:text-cream hover:underline"
                    >
                      Find partners →
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeBookmark(scheme.scheme_id)}
                    className="text-xs text-cream/50 hover:text-red-300 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
