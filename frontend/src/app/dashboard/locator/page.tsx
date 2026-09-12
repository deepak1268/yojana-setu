"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { fetchLocatedPartners } from "@/lib/api";
import type { RankedPartner, SchemeRecommendation } from "@/lib/types";
import PartnerMap, { type PartnerLocation } from "@/components/landing/PartnerMap";

const partnerTypes = ["All", "SCA", "PSB", "RRB", "NBFC-MFI"] as const;

export default function LocatorPage() {
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [partners, setPartners] = useState<RankedPartner[]>([]);
  const [filter, setFilter] = useState<(typeof partnerTypes)[number]>("All");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Dynamic user coordinates - NO hardcoded locations
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocError("Geolocation is not supported by your browser. Please enter coordinates manually.");
      return;
    }

    setLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocError(`Unable to retrieve your location: ${err.message}. Please enter coordinates below.`);
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  }, []);

  // 1. Load recommendations and detect dynamic location on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("ys_last_recommendations");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const list = Array.isArray(parsed) ? parsed : parsed?.recommendations;
          if (Array.isArray(list) && list.length > 0) {
            setRecommendations(list);
          }
        } catch {
          // Ignore invalid storage
        }
      }
    }

    detectLocation();
  }, [detectLocation]);

  // Extract all recommended scheme IDs from scheme_matcher output
  const schemeIds = recommendations
    .map((r) => r.scheme_id)
    .filter((id): id is string => Boolean(id && typeof id === "string" && id.trim().length > 0));

  // 2. Fetch located channel partners from Python backend
  useEffect(() => {
    if (schemeIds.length === 0 || lat === null || lon === null) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetchLocatedPartners({
      scheme_ids: schemeIds,
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
  }, [recommendations, lat, lon]);

  const filteredPartners = useMemo(() => {
    return filter === "All" ? partners : partners.filter((p) => (p.type || p.partner_type) === filter);
  }, [filter, partners]);

  // Convert filtered partners into PartnerLocation shape for PartnerMap
  const mappedLocations: PartnerLocation[] = useMemo(() => {
    return filteredPartners.map((p) => {
      const dist = p.distance_km ?? p._distance_km ?? 0;
      return {
        id: p.partner_id,
        name: p.name,
        city: `${p.city}, ${p.state}`,
        tag: p.type || p.partner_type || "Partner",
        status: `Utilisation ${p.fund_utilization_percent}%`,
        address: `${p.city}, ${p.state} · Capacity: ${p.processing_capacity}`,
        lat: p.latitude,
        lng: p.longitude,
        distance_km: dist,
        processing_capacity: p.processing_capacity,
      };
    });
  }, [filteredPartners]);

  if (recommendations.length === 0) {
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

  return (
    <>
      <Topbar
        title="Partner locator"
        subtitle={`Channel partners supporting your ${recommendations.length} recommended schemes.`}
      />

      <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8 space-y-6">
        {/* Recommended Schemes Indicator */}
        <div className="rounded-2xl border border-navy/10 bg-card p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Target Schemes ({recommendations.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((r) => (
              <span
                key={r.scheme_id}
                className="rounded-full bg-navy/8 px-3 py-1 text-xs font-semibold text-ink"
              >
                {r.scheme_name}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Location Controls */}
        <div className="rounded-3xl border border-navy/10 bg-card p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-sm font-semibold text-ink">Applicant Location</h3>
              <p className="text-xs text-muted mt-0.5">
                {lat !== null && lon !== null
                  ? `Active Coordinates: Latitude ${lat.toFixed(4)}, Longitude ${lon.toFixed(4)}`
                  : "Detecting your dynamic location..."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="rounded-xl border border-navy/15 bg-background px-3.5 py-2 text-xs font-semibold text-ink hover:border-saffron hover:text-saffron-deep disabled:opacity-50 transition"
              >
                {locating ? "Detecting location..." : "Refresh Location"}
              </button>
            </div>
          </div>

          {/* Coordinate manual adjustment fields if needed */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-navy/8 pt-3 text-xs">
            <label className="flex items-center gap-1.5 text-muted">
              <span>Latitude:</span>
              <input
                type="number"
                step="0.0001"
                value={lat ?? ""}
                onChange={(e) => setLat(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g. 28.6139"
                className="w-28 rounded-lg border border-navy/15 bg-background px-2 py-1 text-xs text-ink outline-none focus:border-saffron"
              />
            </label>
            <label className="flex items-center gap-1.5 text-muted">
              <span>Longitude:</span>
              <input
                type="number"
                step="0.0001"
                value={lon ?? ""}
                onChange={(e) => setLon(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g. 77.2090"
                className="w-28 rounded-lg border border-navy/15 bg-background px-2 py-1 text-xs text-ink outline-none focus:border-saffron"
              />
            </label>
            {locError && <span className="text-xs text-red-500">{locError}</span>}
          </div>
        </div>

        {/* Partner Type Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {partnerTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === t ? "bg-navy text-cream" : "bg-navy/8 text-ink hover:bg-navy/12"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Interactive Map & Partners Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Map Panel */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-navy/10 bg-card p-5 sm:p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  Partner Geographic Map
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Click any pin or partner card to inspect details and view directions.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-green animate-pulse" />
                {mappedLocations.length} on map
              </span>
            </div>

            <div className="min-h-[380px] w-full">
              <PartnerMap
                partners={mappedLocations}
                selectedPartnerId={selectedPartnerId}
                onSelectPartner={(p) => setSelectedPartnerId(p ? p.id : null)}
                userPosition={lat !== null && lon !== null ? { lat, lng: lon } : null}
                height="400px"
              />
            </div>
          </div>

          {/* Results List Container */}
          <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-navy/10 bg-card">
            <div className="border-b border-navy/10 bg-background/50 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Eligible Channel Partners ({filteredPartners.length})
              </p>
              <p className="text-xs text-muted/80 mt-0.5">
                Ranked by proximity and processing capacity
              </p>
            </div>

            {loading ? (
              <p className="px-6 py-12 text-center text-sm text-muted">
                Locating and ranking channel partners near your coordinates...
              </p>
            ) : lat === null || lon === null ? (
              <p className="px-6 py-12 text-center text-sm text-muted">
                Please enable location access or enter your latitude and longitude above to view eligible partners.
              </p>
            ) : filteredPartners.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted">
                No eligible partners found for this category.
              </p>
            ) : (
              <ul className="divide-y divide-navy/10 overflow-y-auto max-h-[460px]">
                {filteredPartners.map((p) => {
                  const isSelected = selectedPartnerId === p.partner_id;
                  const dist = p.distance_km ?? p._distance_km ?? 0;
                  const directionsUrl =
                    lat !== null && lon !== null
                      ? `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${p.latitude},${p.longitude}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;

                  return (
                    <li
                      key={p.partner_id}
                      onClick={() => setSelectedPartnerId(p.partner_id)}
                      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-saffron/10 border-l-4 border-saffron"
                          : "hover:bg-cream/40 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink group-hover:text-saffron-deep">
                            {p.name}
                          </p>
                          <span className="rounded-full bg-navy/8 px-2 py-0.5 text-[10px] font-semibold text-ink">
                            {p.type || p.partner_type}
                          </span>
                          {isSelected && (
                            <span className="rounded bg-saffron/20 px-1.5 py-0.5 text-[10px] font-bold text-saffron">
                              Active Pin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {p.city}, {p.state} · {dist.toFixed(1)} km away · Capacity: {p.processing_capacity}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-green/10 px-2.5 py-1 text-[11px] font-semibold text-green">
                          Utilisation {p.fund_utilization_percent}%
                        </span>
                        {p._routing_score !== undefined && (
                          <span className="rounded-full bg-navy/8 px-2.5 py-1 text-[11px] font-semibold text-ink">
                            Score {(p._routing_score * 100).toFixed(0)}
                          </span>
                        )}
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-xl border border-navy/15 bg-background px-3 py-1 text-xs font-semibold text-saffron-deep hover:border-saffron hover:bg-saffron/10 transition"
                        >
                          Directions ↗
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t border-navy/10 bg-cream/40 px-6 py-3 text-xs text-muted">
              <span className="font-semibold text-ink">Tip:</span> Select any partner to center and view pin on the map. Click Directions to open Google Maps navigation in a new tab.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
