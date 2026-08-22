/**
 * Supplements venues that already have a website but came back thin from
 * that extraction (< 2 of 7 completeness signals) with web-search
 * enrichment -- fill-gaps-only, never overwrites a field that already has
 * a value. Unlike enrich-no-website.ts, these venues have real data worth
 * protecting, so a blind overwrite risks replacing a correct
 * website-sourced value with a wrong or stale search result.
 *
 * Run: npm run enrich-thin-websites
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createAdminClient } from "@/lib/supabase/admin";
import { extractVenueFromWebSearch } from "@/lib/venue-extraction";
import { VENUE_CITY_LABELS, type VenueCity } from "@/types/venue";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function has(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
}

function completenessScore(r: {
  capacity_min: number | null;
  capacity_max: number | null;
  sound_system: string;
  rental_fee_amount: number | null;
  description: string | null;
  amenities: string[] | null;
  contact_email: string | null;
  reservation_url: string | null;
  contact_form_url: string | null;
  production_notes: string | null;
}): number {
  let s = 0;
  if (has(r.capacity_min) || has(r.capacity_max)) s++;
  if (r.sound_system !== "unknown") s++;
  if (has(r.rental_fee_amount)) s++;
  if (has(r.description)) s++;
  if (has(r.amenities)) s++;
  if (has(r.production_notes)) s++;
  if (has(r.contact_email) || has(r.reservation_url) || has(r.contact_form_url)) s++;
  return s;
}

/** Only fills a field if the current value is empty — never overwrites. */
function fillIfEmpty<T>(current: T, next: T, isEmpty: (v: T) => boolean): T | undefined {
  return isEmpty(current) && !isEmpty(next as unknown as T) ? next : undefined;
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set — nothing to run.");
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: venues, error } = await supabase
    .from("venues")
    .select(
      "id, name, city, address, capacity_min, capacity_max, sound_system, sound_system_notes, rental_fee_amount, rental_fee_unit, rental_fee_notes, production_notes, amenities, reservation_url, contact_email, contact_form_url, phone, description"
    )
    .eq("source", "ai_extracted");

  if (error) {
    console.error("Failed to load venues:", error.message);
    process.exit(1);
  }

  const thin = venues.filter((v) => completenessScore(v) < 2);
  console.log(`${venues.length} venues have a website; ${thin.length} are thin (<2/7 signals).\n`);

  let updated = 0;
  let noChange = 0;
  let failed = 0;

  for (const venue of thin) {
    try {
      const extraction = await extractVenueFromWebSearch(
        venue.name,
        VENUE_CITY_LABELS[venue.city as VenueCity],
        venue.address
      );

      const patch: Record<string, unknown> = {};
      const isEmptyStr = (v: unknown) => !has(v);
      const isEmptyArr = (v: unknown) => !has(v);

      const capMin = fillIfEmpty(venue.capacity_min, extraction.capacity_min, isEmptyStr);
      if (capMin !== undefined) patch.capacity_min = capMin;
      const capMax = fillIfEmpty(venue.capacity_max, extraction.capacity_max, isEmptyStr);
      if (capMax !== undefined) patch.capacity_max = capMax;

      if (venue.sound_system === "unknown" && extraction.sound_system && extraction.sound_system !== "unknown") {
        patch.sound_system = extraction.sound_system;
      }
      const soundNotes = fillIfEmpty(venue.sound_system_notes, extraction.sound_system_notes, isEmptyStr);
      if (soundNotes !== undefined) patch.sound_system_notes = soundNotes;

      const fee = fillIfEmpty(venue.rental_fee_amount, extraction.rental_fee_amount, isEmptyStr);
      if (fee !== undefined) patch.rental_fee_amount = fee;
      if (
        (venue.rental_fee_unit === "unknown" || !has(venue.rental_fee_unit)) &&
        extraction.rental_fee_unit &&
        extraction.rental_fee_unit !== "unknown"
      ) {
        patch.rental_fee_unit = extraction.rental_fee_unit;
      }
      const feeNotes = fillIfEmpty(venue.rental_fee_notes, extraction.rental_fee_notes, isEmptyStr);
      if (feeNotes !== undefined) patch.rental_fee_notes = feeNotes;

      const prodNotes = fillIfEmpty(venue.production_notes, extraction.production_notes, isEmptyStr);
      if (prodNotes !== undefined) patch.production_notes = prodNotes;

      const amenities = fillIfEmpty(venue.amenities, extraction.amenities, isEmptyArr);
      if (amenities !== undefined) patch.amenities = amenities;

      const reservationUrl = fillIfEmpty(venue.reservation_url, extraction.reservation_url, isEmptyStr);
      if (reservationUrl !== undefined) patch.reservation_url = reservationUrl;
      const contactEmail = fillIfEmpty(venue.contact_email, extraction.contact_email, isEmptyStr);
      if (contactEmail !== undefined) patch.contact_email = contactEmail;
      const contactForm = fillIfEmpty(venue.contact_form_url, extraction.contact_form_url, isEmptyStr);
      if (contactForm !== undefined) patch.contact_form_url = contactForm;
      const phone = fillIfEmpty(venue.phone, extraction.phone, isEmptyStr);
      if (phone !== undefined) patch.phone = phone;
      const description = fillIfEmpty(venue.description, extraction.description, isEmptyStr);
      if (description !== undefined) patch.description = description;

      if (Object.keys(patch).length === 0) {
        console.log(`  no new data: ${venue.name}`);
        noChange += 1;
        await sleep(300);
        continue;
      }

      patch.last_verified_at = new Date().toISOString();
      const { error: updateError } = await supabase.from("venues").update(patch).eq("id", venue.id);

      if (updateError) {
        console.log(`  UPDATE FAILED (${venue.name}): ${updateError.message}`);
        failed += 1;
      } else {
        console.log(`  filled ${Object.keys(patch).length - 1} field(s): ${venue.name}`);
        updated += 1;
      }
    } catch (err) {
      console.log(`  (search failed for ${venue.name}: ${err instanceof Error ? err.message : err})`);
      failed += 1;
    }
    await sleep(300);
  }

  console.log(`\nDone. ${updated} updated, ${noChange} had nothing new, ${failed} failed.`);
}

main();
