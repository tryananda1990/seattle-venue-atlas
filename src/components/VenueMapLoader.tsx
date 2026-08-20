"use client";

import dynamic from "next/dynamic";
import type { Venue } from "@/types/venue";

const VenueMap = dynamic(() => import("./VenueMap").then((m) => m.VenueMap), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-lg overflow-hidden border border-line flex items-center justify-center"
      style={{ height: "70vh" }}
    >
      <p className="text-muted text-sm">Loading map…</p>
    </div>
  ),
});

export function VenueMapLoader({ venues }: { venues: Venue[] }) {
  return <VenueMap venues={venues} />;
}
