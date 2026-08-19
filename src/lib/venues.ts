import { createClient } from "@/lib/supabase/server";
import type {
  RentalFeeUnit,
  SoundSystemStatus,
  Venue,
  VenueCategory,
  VenueCity,
} from "@/types/venue";

export interface VenueFilters {
  city?: VenueCity[];
  category?: VenueCategory[];
  soundSystem?: SoundSystemStatus[];
  minCapacity?: number;
  maxFee?: number;
  publishedPricingOnly?: boolean;
}

export async function getVenues(filters: VenueFilters): Promise<Venue[]> {
  const supabase = await createClient();

  let query = supabase
    .from("venues")
    .select(
      "id, name, slug, category, city, address, capacity_min, capacity_max, sound_system, rental_fee_amount, rental_fee_unit, photos, reservation_url, contact_email, contact_form_url, phone, last_verified_at"
    )
    .order("name");

  if (filters.city?.length) query = query.in("city", filters.city);
  if (filters.category?.length) query = query.in("category", filters.category);
  if (filters.soundSystem?.length) query = query.in("sound_system", filters.soundSystem);
  if (filters.minCapacity) {
    query = query.or(
      `capacity_max.gte.${filters.minCapacity},capacity_max.is.null`
    );
  }
  if (filters.publishedPricingOnly) {
    query = query.not("rental_fee_amount", "is", null);
  }
  if (filters.maxFee) {
    query = filters.publishedPricingOnly
      ? query.lte("rental_fee_amount", filters.maxFee)
      : query.or(`rental_fee_amount.lte.${filters.maxFee},rental_fee_amount.is.null`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load venues: ${error.message}`);
  return (data ?? []) as Venue[];
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load venue: ${error.message}`);
  return data as Venue | null;
}

export function formatCapacity(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Capacity unknown";
  if (min != null && max != null && min !== max) return `${min}–${max} capacity`;
  return `${max ?? min} capacity`;
}

export function formatRentalFee(
  amount: number | null,
  unit: RentalFeeUnit
): string {
  if (amount == null) return "Contact for pricing";
  const perUnit = unit === "unknown" ? "" : ` / ${unit}`;
  return `$${amount.toLocaleString()}${perUnit}`;
}
