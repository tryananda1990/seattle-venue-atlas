/**
 * Fully automatic venue discovery + enrichment sweep across Greater Seattle.
 *
 * Run: npm run discover
 *
 * For every city x search term, queries the Places API (New) for candidate
 * venues (discovery — see PRD §6.1), then for each unique result with a
 * website, fetches and runs the OpenRouter extraction (enrichment — §6.2).
 * Publishes directly (verification_status = "verified") with no review step
 * — a deliberate choice for this pre-launch phase while the site isn't
 * publicly shared yet. Re-running is safe: existing rows are matched and
 * updated by google_place_id rather than duplicated.
 */
import { loadEnvConfig } from "@next/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractVenueFromUrl } from "@/lib/venue-extraction";
import { searchPlacesText } from "@/lib/google-places";
import { slugify } from "@/lib/slugify";
import { VENUE_CITY_LABELS, type VenueCategory, type VenueCity } from "@/types/venue";

const CITY_COORDS: Record<VenueCity, { lat: number; lng: number }> = {
  seattle: { lat: 47.6062, lng: -122.3321 },
  bellevue: { lat: 47.6101, lng: -122.2015 },
  redmond: { lat: 47.674, lng: -122.1215 },
  kirkland: { lat: 47.6769, lng: -122.206 },
  renton: { lat: 47.4829, lng: -122.2171 },
  tacoma: { lat: 47.2529, lng: -122.4443 },
  everett: { lat: 47.979, lng: -122.2021 },
  bothell: { lat: 47.7623, lng: -122.2054 },
  kent: { lat: 47.3809, lng: -122.2348 },
  federal_way: { lat: 47.3223, lng: -122.3126 },
  shoreline: { lat: 47.7557, lng: -122.3415 },
  edmonds: { lat: 47.8107, lng: -122.3774 },
  issaquah: { lat: 47.5301, lng: -122.0326 },
  mercer_island: { lat: 47.5707, lng: -122.2221 },
  lynnwood: { lat: 47.8209, lng: -122.3151 },
};

const SEARCH_TERMS = [
  "performing arts center",
  "theatre auditorium",
  "banquet hall event venue rental",
  "community center hall rental",
  "museum cultural center event rental",
  // Added after the first two sweeps showed these categories were thin:
  "school auditorium performing arts rental",
  "church fellowship hall event space rental",
  "university lecture hall auditorium rental",
  "outdoor amphitheater park stage venue",
  // Real venue types nothing above reliably surfaces:
  "VFW Elks lodge fraternal hall rental",
  "winery brewery barn farm event venue",
];

const SEARCH_RADIUS_METERS = 12_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function guessCategoryFromTypes(types: string[]): VenueCategory {
  const has = (t: string) => types.includes(t);
  if (has("performing_arts_theater") || has("concert_hall")) return "theatre";
  if (has("banquet_hall") || has("wedding_venue") || has("event_venue")) return "event_center";
  if (has("community_center")) return "community_hall";
  if (
    has("church") ||
    has("place_of_worship") ||
    has("synagogue") ||
    has("mosque") ||
    has("hindu_temple")
  )
    return "church_hall";
  if (has("university")) return "university_auditorium";
  if (has("school") || has("secondary_school") || has("primary_school")) return "school_pac";
  if (has("cultural_center") || has("museum")) return "cultural_center";
  if (has("amphitheater") || has("park")) return "outdoor_amphitheater";
  return "event_center";
}

async function uniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;
  for (let tries = 0; tries < 20; tries++) {
    const { data: existing } = await supabase.from("venues").select("id").eq("slug", slug).maybeSingle();
    if (!existing) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return `${baseSlug}-${Date.now()}`;
}

async function main() {
  loadEnvConfig(process.cwd());

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error("GOOGLE_PLACES_API_KEY is not set in .env.local — aborting.");
    process.exit(1);
  }

  const supabase = createAdminClient();

  const found = new Map<string, { place: Awaited<ReturnType<typeof searchPlacesText>>[number]; city: VenueCity }>();

  console.log("Discovering venues via Places API...\n");
  for (const city of Object.keys(CITY_COORDS) as VenueCity[]) {
    const bias = { ...CITY_COORDS[city], radiusMeters: SEARCH_RADIUS_METERS };
    for (const term of SEARCH_TERMS) {
      const query = `${term} in ${VENUE_CITY_LABELS[city]}, WA`;
      try {
        const results = await searchPlacesText(query, bias);
        for (const place of results) {
          if (!found.has(place.placeId)) found.set(place.placeId, { place, city });
        }
        console.log(`  ${query} -> ${results.length} results`);
      } catch (err) {
        console.error(`  ${query} -> FAILED: ${err instanceof Error ? err.message : err}`);
      }
      await sleep(150);
    }
  }

  console.log(`\nFound ${found.size} unique venues. Enriching + publishing...\n`);

  let created = 0;
  let updated = 0;
  let enriched = 0;
  let skipped = 0;

  for (const { place, city } of found.values()) {
    if (!place.address) {
      console.log(`  SKIP (no address): ${place.name}`);
      skipped += 1;
      continue;
    }

    let extraction: Awaited<ReturnType<typeof extractVenueFromUrl>> | null = null;
    if (place.websiteUri) {
      try {
        extraction = await extractVenueFromUrl(place.websiteUri);
        enriched += 1;
      } catch (err) {
        console.log(
          `  (enrichment failed for ${place.name}: ${err instanceof Error ? err.message : err})`
        );
      }
      await sleep(300);
    }

    const name = extraction?.name || place.name;
    const category = extraction?.category_guess ?? guessCategoryFromTypes(place.types);

    const row = {
      name,
      category,
      city,
      address: extraction?.address || place.address,
      location:
        place.latitude != null && place.longitude != null
          ? `SRID=4326;POINT(${place.longitude} ${place.latitude})`
          : null,
      capacity_min: extraction?.capacity_min ?? null,
      capacity_max: extraction?.capacity_max ?? null,
      sound_system: extraction?.sound_system ?? "unknown",
      sound_system_notes: extraction?.sound_system_notes ?? null,
      rental_fee_amount: extraction?.rental_fee_amount ?? null,
      rental_fee_unit: extraction?.rental_fee_unit ?? "unknown",
      rental_fee_notes: extraction?.rental_fee_notes ?? null,
      production_notes: extraction?.production_notes ?? null,
      amenities: extraction?.amenities ?? [],
      reservation_url: extraction?.reservation_url ?? null,
      contact_email: extraction?.contact_email ?? null,
      contact_form_url: extraction?.contact_form_url ?? null,
      phone: extraction?.phone || place.phone,
      website_url: place.websiteUri,
      description: extraction?.description ?? null,
      source: extraction ? "ai_extracted" : "google_places",
      google_place_id: place.placeId,
      verification_status: "verified",
      last_verified_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("venues")
      .select("id, slug")
      .eq("google_place_id", place.placeId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("venues").update(row).eq("id", existing.id);
      if (error) {
        console.log(`  UPDATE FAILED (${name}): ${error.message}`);
      } else {
        console.log(`  updated: ${name}`);
        updated += 1;
      }
    } else {
      const slug = await uniqueSlug(supabase, slugify(name));
      const { error } = await supabase.from("venues").insert({ ...row, slug });
      if (error) {
        console.log(`  INSERT FAILED (${name}): ${error.message}`);
      } else {
        console.log(`  created: ${name}`);
        created += 1;
      }
    }
  }

  console.log(
    `\nDone. ${created} created, ${updated} updated, ${enriched} enriched, ${skipped} skipped.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
