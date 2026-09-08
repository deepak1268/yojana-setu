"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { samplePartners, sampleRecommendations } from "@/lib/mock-data";
import type { Partner, RankedPartner, SchemeRecommendation } from "@/lib/types";

// Mirrors ai/partner_locator.py's thresholds and weights so ranking behaves
// the same way once real data/backend replaces the sample dataset.
const MAX_FUND_UTILIZATION = 85.0;
const MAX_NPA = 7.0;
const MAX_OVERDUE = 10.0;
const WEIGHT_FUND = 0.25;
const WEIGHT_NPA = 0.15;
const WEIGHT_OVERDUE = 0.1;
const WEIGHT_CAPACITY = 0.1;
const WEIGHT_DISTANCE = 0.4;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function isEligible(p: Partner, schemeId: string) {
  return (
    p.active &&
    p.supported_schemes.includes(schemeId) &&
    p.fund_utilization_percent < MAX_FUND_UTILIZATION &&
    p.npa_percent < MAX_NPA &&
    p.overdue_percent < MAX_OVERDUE
  );
}

function capacityScore(c: Partner["processing_capacity"]) {
  return c === "high" ? 1 : c === "medium" ? 0.6 : 0.3;
}

function rankPartners(partners: Partner[], userLat: number, userLon: number): RankedPartner[] {
  const withDistance = partners.map((p) => ({
    partner: p,
    distance: haversineKm(userLat, userLon, p.latitude, p.longitude),
  }));
  const distances = withDistance.map((d) => d.distance);
  const min = Math.min(...distances);
  const max = Math.max(...distances);

  return withDistance
    .map(({ partner, distance }) => {
      const distScore = max === min ? 1 : 1 - (distance - min) / (max - min);
      const fundScore = Math.max(0, 1 - partner.fund_utilization_percent / MAX_FUND_UTILIZATION);
      const npaScore = Math.max(0, 1 - partner.npa_percent / MAX_NPA);
      const overdueScore = Math.max(0, 1 - partner.overdue_percent / MAX_OVERDUE);
      const capScore = capacityScore(partner.processing_capacity);
      const score =
        distScore * WEIGHT_DISTANCE +
        fundScore * WEIGHT_FUND +
        npaScore * WEIGHT_NPA +
        overdueScore * WEIGHT_OVERDUE +
        capScore * WEIGHT_CAPACITY;
      return { ...partner, _routing_score: score, _distance_km: distance };
    })
    .sort((a, b) => b._routing_score - a._routing_score);
}

const partnerTypes = ["All", "SCA", "PSB", "RRB", "NBFC-MFI"] as const;

export default function LocatorPage() {
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>(sampleRecommendations);
  const [filter, setFilter] = useState<(typeof partnerTypes)[number]>("All");

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

  const schemeId = recommendations[0]?.scheme_id ?? "";
  // Sample user location — swap for browser geolocation once wired to a backend.
  const userLat = 28.6139;
  const userLon = 77.209;

  const ranked = useMemo(() => {
    const eligible = samplePartners.filter((p) => isEligible(p, schemeId));
    const top = rankPartners(eligible, userLat, userLon);
    return filter === "All" ? top : top.filter((p) => p.type === filter);
  }, [schemeId, filter]);

  return (
    <>
      <Topbar
        title="Partner locator"
        subtitle={`Eligible partners for ${recommendations[0]?.scheme_name ?? "your matched scheme"}.`}
      />

      <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap gap-2">
          {partnerTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                filter === t ? "bg-navy text-cream" : "bg-navy/8 text-ink hover:bg-navy/12"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-navy/10 bg-card">
          {ranked.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted">
              No eligible channel partner found for this scheme yet — the sample dataset only covers Delhi.
            </p>
          ) : (
            <ul className="divide-y divide-navy/10">
              {ranked.map((p) => (
                <li key={p.partner_id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-muted">
                      {p.type} · {p.city}, {p.state} · {p._distance_km.toFixed(1)} km
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-green/10 px-2.5 py-1 text-[11px] font-semibold text-green">
                      Utilisation {p.fund_utilization_percent}%
                    </span>
                    <span className="rounded-full bg-navy/8 px-2.5 py-1 text-[11px] font-semibold text-ink">
                      Score {(p._routing_score * 100).toFixed(0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
