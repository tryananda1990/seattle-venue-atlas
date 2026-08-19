// No `import "server-only"` here: this module is imported by
// scripts/discover.ts, run via plain Node (tsx), where that marker throws
// unconditionally. Never import this file from a Client Component.

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUri: string | null;
  phone: string | null;
  types: string[];
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.types",
].join(",");

interface PlacesApiPlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  types?: string[];
}

/**
 * Text Search via the Places API (New) — the official, ToS-compliant way to
 * discover venues (see PRD §6: scraping Google Maps/Reviews directly is not
 * allowed, but the Places API is).
 */
export async function searchPlacesText(
  query: string,
  bias: { lat: number; lng: number; radiusMeters: number }
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set.");

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: bias.lat, longitude: bias.lng },
          radius: bias.radiusMeters,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Places API error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as { places?: PlacesApiPlace[] };
  const places = json.places ?? [];

  return places.map((p) => ({
    placeId: p.id,
    name: p.displayName?.text ?? "Unknown venue",
    address: p.formattedAddress ?? null,
    latitude: p.location?.latitude ?? null,
    longitude: p.location?.longitude ?? null,
    websiteUri: p.websiteUri ?? null,
    phone: p.nationalPhoneNumber ?? null,
    types: p.types ?? [],
  }));
}
