/**
 * Runs web-search enrichment against venues already in the database that
 * have no website (source = 'google_places') -- targeted alternative to a
 * full npm run discover, which would also re-touch every already-enriched
 * venue and re-run all Places API discovery queries for no benefit here.
 *
 * Run: npm run enrich-no-website
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createAdminClient } from "@/lib/supabase/admin";
import { extractVenueFromWebSearch } from "@/lib/venue-extraction";
import { VENUE_CITY_LABELS, type VenueCity } from "@/types/venue";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set — nothing to run.");
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, city, address")
    .eq("source", "google_places");

  if (error) {
    console.error("Failed to load venues:", error.message);
    process.exit(1);
  }

  console.log(`Found ${venues.length} no-website venues. Enriching via web search...\n`);

  let succeeded = 0;
  let failed = 0;

  for (const venue of venues) {
    try {
      const extraction = await extractVenueFromWebSearch(
        venue.name,
        VENUE_CITY_LABELS[venue.city as VenueCity],
        venue.address
      );

      const { error: updateError } = await supabase
        .from("venues")
        .update({
          name: extraction.name || venue.name,
          category: extraction.category_guess ?? undefined,
          address: extraction.address || venue.address,
          capacity_min: extraction.capacity_min,
          capacity_max: extraction.capacity_max,
          sound_system: extraction.sound_system ?? "unknown",
          sound_system_notes: extraction.sound_system_notes,
          rental_fee_amount: extraction.rental_fee_amount,
          rental_fee_unit: extraction.rental_fee_unit ?? "unknown",
          rental_fee_notes: extraction.rental_fee_notes,
          production_notes: extraction.production_notes,
          amenities: extraction.amenities ?? [],
          reservation_url: extraction.reservation_url,
          contact_email: extraction.contact_email,
          contact_form_url: extraction.contact_form_url,
          phone: extraction.phone,
          description: extraction.description,
          source: "web_search",
          last_verified_at: new Date().toISOString(),
        })
        .eq("id", venue.id);

      if (updateError) {
        console.log(`  UPDATE FAILED (${venue.name}): ${updateError.message}`);
        failed += 1;
      } else {
        console.log(`  enriched: ${venue.name}`);
        succeeded += 1;
      }
    } catch (err) {
      console.log(`  (search failed for ${venue.name}: ${err instanceof Error ? err.message : err})`);
      failed += 1;
    }
    await sleep(300);
  }

  console.log(`\nDone. ${succeeded} enriched, ${failed} failed/skipped.`);
}

main();
