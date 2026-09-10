"use client";

import { useState } from "react";
import PartnerMap, { DEFAULT_PARTNERS, PartnerLocation } from "./PartnerMap";

export function PartnerPreview() {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>("sca-1");

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
      <div className="grid overflow-hidden rounded-3xl border border-navy/10 bg-card shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        {/* Map Panel */}
        <div className="relative flex flex-col justify-between bg-navy p-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.2em] text-saffron uppercase">
                Geo-spatial locator
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/10 px-2.5 py-1 text-[11px] font-medium text-cream/90">
                <span className="h-2 w-2 rounded-full bg-green animate-pulse" />
                Live Network
              </span>
            </div>
            <h3 className="mt-2 font-display text-2xl text-cream">
              Nearest partner that can still process your category
            </h3>
            <p className="mt-1 text-xs text-cream/70">
              Interactive map showing verified processing partners nearest to your detected location.
            </p>
          </div>

          <div className="mt-6">
            <PartnerMap
              partners={DEFAULT_PARTNERS}
              selectedPartnerId={selectedPartnerId}
              onSelectPartner={(p) => setSelectedPartnerId(p ? p.id : null)}
              height="350px"
            />
          </div>
        </div>

        {/* Partners List Panel */}
        <div className="flex flex-col justify-between">
          <div className="border-b border-navy/10 bg-background/50 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Processing Partners
            </p>
            <p className="text-xs text-muted/80">
              Click any branch to focus on the map and view directions
            </p>
          </div>

          <ul className="divide-y divide-navy/10">
            {DEFAULT_PARTNERS.map((p) => {
              const isSelected = selectedPartnerId === p.id;
              return (
                <li
                  key={p.id}
                  onClick={() => setSelectedPartnerId(p.id)}
                  className={`group flex cursor-pointer items-center justify-between gap-3 px-6 py-4 transition-colors ${
                    isSelected
                      ? "bg-saffron/10 border-l-4 border-saffron"
                      : "hover:bg-cream/60 border-l-4 border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink group-hover:text-saffron-deep">
                        {p.name}
                      </p>
                      {isSelected && (
                        <span className="rounded bg-saffron/20 px-1.5 py-0.2 text-[10px] font-bold text-saffron">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      <span className="font-semibold text-foreground/80">{p.tag}</span> · {p.city}
                    </p>
                    {p.address && isSelected && (
                      <p className="mt-1 text-[11px] text-muted/90">{p.address}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="rounded-full bg-green/10 px-2.5 py-1 text-[11px] font-semibold text-green">
                      {p.status}
                    </span>
                    <span className="text-[11px] font-medium text-saffron opacity-0 transition-opacity group-hover:opacity-100">
                      View pin →
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-navy/10 bg-cream/40 px-6 py-3 text-xs text-muted">
            <span className="font-semibold text-ink">Tip:</span> All listed partners can accept category applications under central &amp; state schemes.
          </div>
        </div>
      </div>
    </section>
  );
}
