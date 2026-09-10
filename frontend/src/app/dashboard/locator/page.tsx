"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { fetchLocatedPartners } from "@/lib/api";
import type { RankedPartner, SchemeRecommendation } from "@/lib/types";

const partnerTypes = ["All", "SCA", "PSB", "RRB", "NBFC-MFI"] as const;

export default function LocatorPage() {
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [partners, setPartners] = useState<RankedPartner[]>([]);
  const [filter, setFilter] = useState<(typeof partnerTypes)[number]>("All");
  const [lat, setLat] = useState<number>(28.6139);
  const [lon, setLon] = useState<number>(77.2090);
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

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLon(pos.coords.longitude);
        },
        () => {
          // Fallback to default coordinates if permission denied
        }
      );
    }
  }, []);

  const scheme = recommendations[0];

  useEffect(() => {
    if (!scheme) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetchLocatedPartners({
      scheme_id: scheme.scheme_id,
      latitude: lat,
      longitude: lon,
    })
      .then((data) => {
        if (!isCancelled) {
          setPartners(data.partners || []);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to locate channel partners.");
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [scheme, lat, lon]);

  if (!scheme) {
    return (
      <>
        <Topbar title="Partner locator" subtitle="Eligible channel partners near you." />
        <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <div className="rounded-3xl border border-dashed border-navy/15 p-8 text-center text-sm text-muted">
            Please run the scheme recommender first to find matched schemes and locate nearby channel partners.
          </div>
        </div>
      </>
    );
  }

  const filteredPartners = filter === "All" ? partners : partners.filter((p) => p.type === filter);

  return (
    <>
      <Topbar
        title="Partner locator"
        subtitle={`Eligible partners for ${scheme.scheme_name}.`}
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

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-navy/10 bg-card">
          {loading ? (
            <p className="px-6 py-8 text-center text-sm text-muted">
              Searching and ranking channel partners near your location...
            </p>
          ) : filteredPartners.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted">
              No eligible channel partner found for this scheme near your location ({lat.toFixed(2)}, {lon.toFixed(2)}).
            </p>
          ) : (
            <ul className="divide-y divide-navy/10">
              {filteredPartners.map((p) => (
                <li key={p.partner_id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-muted">
                      {p.type} · {p.city}, {p.state} · {(p._distance_km ?? 0).toFixed(1)} km
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-green/10 px-2.5 py-1 text-[11px] font-semibold text-green">
                      Utilisation {p.fund_utilization_percent}%
                    </span>
                    <span className="rounded-full bg-navy/8 px-2.5 py-1 text-[11px] font-semibold text-ink">
                      Score {((p._routing_score ?? 0) * 100).toFixed(0)}
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
