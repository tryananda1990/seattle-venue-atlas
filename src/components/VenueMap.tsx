"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Map, Source, Layer, Popup, type MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import { VENUE_CATEGORY_LABELS, type Venue } from "@/types/venue";

type MappableVenue = Pick<Venue, "id" | "slug" | "name" | "category" | "latitude" | "longitude">;

const SEATTLE_VIEW = { longitude: -122.25, latitude: 47.55, zoom: 9 };

// Mapbox paint properties need a literal color, not a CSS var() reference —
// matches the --accent token in globals.css (light-mode value; the map
// itself doesn't switch with the OS theme).
const MAP_ACCENT = "#2f6f62";

const clusterLayer: import("react-map-gl/mapbox").LayerProps = {
  id: "clusters",
  type: "circle",
  source: "venues",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": MAP_ACCENT,
    "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
    "circle-opacity": 0.85,
  },
};

const clusterCountLayer: import("react-map-gl/mapbox").LayerProps = {
  id: "cluster-count",
  type: "symbol",
  source: "venues",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-size": 12,
    "text-font": ["Open Sans Bold"],
  },
  paint: { "text-color": "#ffffff" },
};

const pointLayer: import("react-map-gl/mapbox").LayerProps = {
  id: "unclustered-point",
  type: "circle",
  source: "venues",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": MAP_ACCENT,
    "circle-radius": 6,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": "#ffffff",
  },
};

export function VenueMap({ venues }: { venues: MappableVenue[] }) {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<MappableVenue | null>(null);

  const mappable = useMemo(() => venues.filter((v) => v.latitude != null && v.longitude != null), [venues]);
  const missingCount = venues.length - mappable.length;

  const geojson: FeatureCollection<Point> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: mappable.map((v) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [v.longitude!, v.latitude!] },
        properties: { id: v.id, slug: v.slug, name: v.name, category: v.category },
      })),
    }),
    [mappable]
  );

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <p className="text-muted text-sm border border-dashed border-line rounded-lg px-5 py-8 text-center">
        Map view needs a Mapbox token — add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local.
      </p>
    );
  }

  function handleClick(e: MapMouseEvent) {
    const feature = e.features?.[0];
    if (!feature) return;

    if (feature.layer?.id === "clusters") {
      const clusterId = feature.properties?.cluster_id as number | undefined;
      const map = mapRef.current?.getMap();
      const source = map?.getSource("venues") as import("mapbox-gl").GeoJSONSource | undefined;
      if (!source || clusterId == null) return;
      const coordinates = (feature.geometry as Point).coordinates as [number, number];
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        map?.easeTo({ center: coordinates, zoom, duration: 400 });
      });
      return;
    }

    if (feature.layer?.id === "unclustered-point") {
      const props = feature.properties as { id: string; slug: string; name: string; category: string };
      const venue = mappable.find((v) => v.id === props.id);
      if (venue) setSelected(venue);
    }
  }

  return (
    <div>
      {missingCount > 0 && (
        <p className="text-xs text-muted mb-2">
          {missingCount} of {venues.length} matching venues don&apos;t have map coordinates yet and
          aren&apos;t shown here.
        </p>
      )}
      <div className="rounded-lg overflow-hidden border border-line h-[70vh]">
        <Map
          ref={mapRef}
          mapboxAccessToken={token}
          initialViewState={SEATTLE_VIEW}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactiveLayerIds={["clusters", "unclustered-point"]}
          onClick={handleClick}
        >
          <Source
            id="venues"
            type="geojson"
            data={geojson}
            cluster
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...pointLayer} />
          </Source>

          {selected && (
            <Popup
              longitude={selected.longitude!}
              latitude={selected.latitude!}
              onClose={() => setSelected(null)}
              closeOnClick={false}
              anchor="bottom"
            >
              <div className="text-sm">
                <div className="text-xs uppercase tracking-wide text-accent font-medium mb-1">
                  {VENUE_CATEGORY_LABELS[selected.category]}
                </div>
                <div className="font-semibold mb-2">{selected.name}</div>
                <button
                  onClick={() => router.push(`/venues/${selected.slug}`)}
                  className="text-accent underline underline-offset-2 text-sm"
                >
                  View details
                </button>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
