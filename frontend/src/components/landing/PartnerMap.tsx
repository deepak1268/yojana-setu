"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";

export interface PartnerLocation {
  id: string;
  name: string;
  city: string;
  tag: string;
  status: string;
  address?: string;
  timing?: string;
  lat: number;
  lng: number;
}

export const DEFAULT_PARTNERS: PartnerLocation[] = [
  {
    id: "sca-1",
    name: "State Channelising Agency",
    city: "Your district HQ",
    tag: "SCA",
    status: "Eligible",
    address: "District Industries & Finance HQ, Central Delhi",
    timing: "9:30 AM – 5:30 PM",
    lat: 28.6271,
    lng: 77.2155,
  },
  {
    id: "psb-1",
    name: "Public Sector Bank branch",
    city: "2.4 km away",
    tag: "PSB",
    status: "Utilisation OK",
    address: "Parliament Street Commercial Hub, New Delhi",
    timing: "10:00 AM – 4:00 PM",
    lat: 28.6328,
    lng: 77.2201,
  },
  {
    id: "rrb-1",
    name: "Regional Rural Bank",
    city: "6.1 km away",
    tag: "RRB",
    status: "Eligible",
    address: "Ring Road Regional Branch, South Delhi",
    timing: "10:00 AM – 4:00 PM",
    lat: 28.5684,
    lng: 77.2435,
  },
  {
    id: "mfi-1",
    name: "NBFC-MFI (micro only)",
    city: "1.1 km away",
    tag: "MFI",
    status: "Micro finance",
    address: "Pusa Road Microcredit Center, Karol Bagh",
    timing: "9:00 AM – 6:00 PM",
    lat: 28.6215,
    lng: 77.195,
  },
];

export const DEFAULT_USER_POSITION = {
  lat: 28.6139,
  lng: 77.209,
};

interface MapControllerProps {
  targetLocation?: { lat: number; lng: number } | null;
}

function MapController({ targetLocation }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (map && targetLocation) {
      map.panTo(targetLocation);
      map.setZoom(13);
    }
  }, [map, targetLocation]);

  return null;
}

export interface PartnerMapProps {
  partners?: PartnerLocation[];
  selectedPartnerId?: string | null;
  onSelectPartner?: (partner: PartnerLocation | null) => void;
  userPosition?: { lat: number; lng: number };
  className?: string;
  height?: string;
}

export default function PartnerMap({
  partners = DEFAULT_PARTNERS,
  selectedPartnerId,
  onSelectPartner,
  userPosition = DEFAULT_USER_POSITION,
  className = "",
  height = "380px",
}: PartnerMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  // Derive active partner from props when controlled, or fallback to internal state
  const activeId = selectedPartnerId !== undefined ? selectedPartnerId : internalSelectedId;
  const activePartner = partners.find((p) => p.id === activeId) || null;

  const handleMarkerClick = (partner: PartnerLocation) => {
    if (selectedPartnerId === undefined) {
      setInternalSelectedId(partner.id);
    }
    if (onSelectPartner) {
      onSelectPartner(partner);
    }
  };

  const handleCloseInfoWindow = () => {
    if (selectedPartnerId === undefined) {
      setInternalSelectedId(null);
    } else if (onSelectPartner) {
      onSelectPartner(null);
    }
  };

  if (!apiKey) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream/25 bg-navy/60 p-6 text-center text-cream ${className}`}
        style={{ minHeight: height }}
      >
        <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-saffron/25 text-saffron">
          📍
        </div>
        <p className="text-sm font-semibold text-cream">Google Maps Key Needed</p>
        <p className="mt-1 max-w-xs text-xs text-cream/70">
          Add <code className="rounded bg-navy/80 px-1 py-0.5 text-saffron">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment file to view the live interactive map.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-cream/15 shadow-lg ${className}`}
      style={{ height }}
    >
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={userPosition}
          defaultZoom={12}
          mapId={mapId}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          className="h-full w-full"
        >
          <MapController
            targetLocation={
              activePartner ? { lat: activePartner.lat, lng: activePartner.lng } : null
            }
          />

          {/* User Location Marker ("You") */}
          <AdvancedMarker position={userPosition} title="You (Detected Location)">
            <Pin background="#e36a1a" glyphColor="#ffffff" borderColor="#c45312" scale={1.15} />
          </AdvancedMarker>

          {/* Partner Locations Markers */}
          {partners.map((partner) => {
            const isSelected = activePartner?.id === partner.id;
            return (
              <AdvancedMarker
                key={partner.id}
                position={{ lat: partner.lat, lng: partner.lng }}
                title={`${partner.name} (${partner.tag})`}
                onClick={() => handleMarkerClick(partner)}
              >
                <Pin
                  background={isSelected ? "#e36a1a" : "#1f6b4a"}
                  glyphColor="#ffffff"
                  borderColor={isSelected ? "#c45312" : "#0d2137"}
                  scale={isSelected ? 1.2 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

          {/* Partner Detail Info Window */}
          {activePartner && (
            <InfoWindow
              position={{ lat: activePartner.lat, lng: activePartner.lng }}
              onCloseClick={handleCloseInfoWindow}
              pixelOffset={[0, -32]}
            >
              <div className="max-w-[240px] p-1 text-navy">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-navy px-1.5 py-0.5 text-[10px] font-bold text-cream">
                    {activePartner.tag}
                  </span>
                  <span className="rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-semibold text-green">
                    {activePartner.status}
                  </span>
                </div>
                <h4 className="mt-1.5 text-sm font-bold text-ink leading-snug">
                  {activePartner.name}
                </h4>
                {activePartner.address && (
                  <p className="mt-1 text-xs text-muted leading-tight">
                    {activePartner.address}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-navy/10 pt-1.5 text-[11px]">
                  <span className="font-medium text-muted">{activePartner.city}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activePartner.lat},${activePartner.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-saffron hover:underline"
                  >
                    Directions →
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}